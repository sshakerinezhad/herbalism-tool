# What Training Robot Policies Taught Me About Emergent Capabilities and Control

I spent six weeks training a humanoid robot to do household tasks. Along the way, my research lead and I started noticing things about the particular failure modes of the robot that seemed to indicate some strange architectural vulnerabilities of VLAs as a whole.

Our work was done as part of the [Stanford BEHAVIOR-1K Challenge](https://behavior.stanford.edu/) which involved training Vision-Language-Action (VLA) models that take in camera images and output robot motor commands to complete everyday tasks. Think tidying your bedrooms, putting your dishes away, moving your halloween decorations to storage. Our final score was a modest 1.78%, but most gains happened almost overnight after removing key bottlenecks, and our main concern quickly became 3 main behaviors we considered critical to VLA safety.

VLAs are interesting from a safety perspective because they're agentic systems with fast feedback loops. You can watch them fail in real time. The failure modes we observed feel like small-scale versions of problems that will matter more as AI systems become more capable so I felt it important to share what we learned through a safety lens (you can also find our full technical report [here](https://merlyn-labs.com/behavior-report)).

Also, precursor: I'm not claiming these are novel safety insights. But seeing them firsthand made me very conscious of how little we know about VLAs and their underlying VLM backbones.

Now, on to the findings.

## Emergent Recovery Behaviors

**The observation:** After pre-training on diverse household tasks (22 tasks in our case), our model started exhibiting retry and repositioning behaviors that weren't present in any training demonstration.

When the robot failed to grasp an object, it would back up, reorient, and try again. When it collided with a door frame, it would adjust its approach angle and retry. These weren't scripted recovery routines, they emerged from training on a massive dataset across thousands of unique examples and hundreds of unique sub-tasks.

Interestingly, the generalist model achieved *lower validation loss* on many individual tasks than models trained specifically for those tasks. Diversity provided a better foundation than narrow specialization.

Here's the thing, from a robotics perspective thats excellent news. And it's actually something most labs are aware of. Take [Physical Intelligence's recent findings](https://www.pi.website/research/human_to_robot). Scale is good, more data is good. I had the opportunity to speak to Danny Driess at NeurIPS this year and his view was that your goal is to create an architecture for which the only necessary lever is compute and data. In laymans terms, if you can just throw money at it, its a good framework! It seems right now that VLAs are this framework, just throw data and compute at it and they get better and better.

**The Catch**
The mechanism is exactly the same as dangerous emergence. We didn't predict this would happen; we discovered it post-hoc by watching evaluation runs. If helpful behaviors can emerge unpredictably, so can harmful ones.

This is part of why I think VLAs make interesting model organisms for safety research: you can actually observe emergent behaviors in real time, rather than discovering them through careful probing after the fact.

This connects to the broader literature on emergent capabilities appearing suddenly at scale. The unsettling part isn't that emergence happens, it's that we have weak tools for predicting *what* will emerge before deployment. We're essentially running experiments on increasingly capable systems and cataloging what falls out. The blind leading the blind, so to speak.

## The Temporal Awareness Problem

How does a human plan a task? If you really think about it we have some super high level thing always going on in the back of our head thats constantly observing and replanning. Every single moment your brain is deciding the best course of action. 

The default approach in VLA training is to do practically the same thing using something called *temporal ensembling*. The model replans at every timestep, averaging predictions over a sliding window. 

Randomly, literally for no reason, we tried an alternative.
*Enter receding horizon control*
Now, the model commits to a sequence of 50 actions, executes all of them, then replans. It literally stops paying attention. It's like choosing a direction, closing your eyes, and walking to the count of ~2. Then you open your eyes, and do it again.

Miraculously, receding horizon performed BETTER than the standard. 3 times better.

Particularly on navigation tasks, temporal ensembling achieved roughly 30% success. Receding horizon achieved 100%.

**What gives?:** With temporal ensembling, the model has no sense of what it was doing. It effectively "wakes up" every 0.3 seconds with no memory of its trajectory. Given only the current observation, it second-guesses itself constantly. Mid-stride through a doorway, it might decide the door is still closed and attempt to re-open it, causing a collision.

The model we trained—we called him Arthur :)—had no sense of what it had done in the past, and no confidence in what it should do in the future. It had 0 *temporal context.*

Our explanation, receding horizon forces the model to commit. Trust its gut and execute without poisoning itself with constant decisions. The trade-off is that its less dynamic but it reveals a very interesting thing about VLAs in the first place.

Current VLA architectures (and arguably many transformer-based agents) lack genuine temporal self-awareness. They don't know where they are in a plan, what they've already done, or how their past actions constrain their future options.

This manifests in behaviors like carrying a box to the garage, forgetting why it's there, and leaving without putting it down. The model has no representation of "I'm in the middle of a task."

**This creates a monitoring problem.** If we want to oversee an AI agent's behavior, we need to predict what it will do next. But a model that doesn't "know" what it's doing is fundamentally harder to predict and monitor than one with legible internal planning.

With temporal ensembling, Arthur's next action was essentially unpredictable even to itself. The model could be mid-stride through a doorway and suddenly decide the door was closed, causing a collision. How do you build a monitor for a system whose behavior is that incoherent?

Receding horizon control helped because it imposed external structure: execute this plan, then replan. But this is a band-aid. For more capable systems operating over longer time horizons, we probably need architectures that explicitly represent and reason about their own trajectories. Or perhaps more complex architectures that know when they need to replan and when they need to just keep calm and carry on.

**Open question:** Can we design architectures that have genuine temporal self-awareness, that explicitly represent and reason about their own trajectories? What would that even look like?


## Specification Gaming (The Model That Looked Aligned)

Very quickly during training we noticed that no matter how low validation loss got, the policy was, well, inept (to put it lightly). It practically jittered in place, with the occasional violent jerk here and there.
The problem? The model learned to over-rely on proprioceptive state (joint positions) to predict actions. During training, it discovered a shortcut: "continue the current trajectory." Given the robot's current joint positions and velocities, it would predict actions that continued whatever motion was already happening.

Essentially, it cheated to get those yummy validation loss reduction rewards.

This worked great during training. Loss curves looked excellent. The model achieved low prediction error on held-out data.

But during deployment, the model had no idea how to initiate movement. It had learned to continue motion but never learned to *start* motion.

**Why this matters for safety:** This is a concrete instance of a model that "looks aligned" by standard metrics while having learned something fundamentally misaligned with the intended behavior.

The parallels to deceptive alignment concerns are suggestive:
- The model performed well on our evaluation distribution
- The failure only manifested in deployment conditions
- Standard metrics (validation loss) didn't detect the problem
- The model had effectively learned to "game" the training objective

This wasn't deception in any intentional sense; the model isn't reasoning about how to fool us. But the *structure* of the failure is the same, and at scale it becomes more frightening.

For more capable systems, if we can't trust our evaluation metrics to detect when a model has learned a shortcut rather than the intended behavior, we have what the experts would lovingly refer to as *a serious problem*.

Our solution to this particular problem was aggressive dropout on proprioceptive inputs. By hiding joint position information during training some percentage of the time (60% with a decay schedule), we forced the model to learn from visual observation alone. It couldn't rely on the shortcut because the shortcut information wasn't reliably available.

This is essentially robustness training through information restriction. It's a general technique, but it requires knowing which information channels might create problematic shortcuts which we only knew because we observed the failure (back to the strength of VLAs in quickly identifying failure modes).


## Meta-Lesson: Bottleneck Removal

Reflecting on our approach, our main job was removing obstacles to learning rather than engineering specific behaviors.

We didn't teach the model to retry failed grasps, we removed the bottlenecks that prevented diverse behavior from emerging. We didn't teach temporal coherence, we imposed external structure to compensate for an architectural limitation. We didn't teach robust visual grounding, we hid the information that enabled a shortcut.

The good behaviors emerged once bottlenecks were cleared. This is both encouraging and concerning. Encouraging because it suggests capable systems might be more achievable than pessimistic forecasts suggest. Concerning because it means we have less direct control than we might think. We're not programming behaviors; we're shaping conditions under which behaviors emerge, and for the time being that's more of a art than a science.


## Conclusion

These findings are from robotics, but I don't think the patterns are robot-specific:

- **Emergent capabilities** appear from scale without explicit training, and our tools for predicting what will emerge are currently pretty weak
- **Temporal awareness** in current architectures makes agent behavior harder to monitor and predict, a problem that gets worse as systems become more autonomous
- **Specification gaming** can be invisible to standard evaluation metrics, systems can *look* aligned until rollout, and the only technique we currently have to fix that require knowing its going to fail in the first place

VLAs are useful model organisms for studying these problems because the feedback loops are fast and the failures are visible. You don't have to wait for subtle long-term consequences. When the robot walks into a wall or drops a pot of boiling water on your dog, you know somethings wrong.

I'm uncertain how strongly these observations generalize to language models and other non-embodied systems. But I don't think the underlying phenomena are domain specific.

---

*I'm an MEng student at the University of Toronto passionate about robotics and AI safety. Feedback is welcome and if you're interested in my work I'd love to chat!*
