# Bugs
* Making fresh knight profile page still says make new knight. Sometimes reloading fixes
* Updating CON increases max but not current HP
* Save changes on edit profile should take you back to profile
* Brew option not available for some reason, even as herbalist
* Custom weapon requires long range, ranges confusion (which to fill?)
* Could not find the ‘range_long’ column of ‘character_weapons’ in the schema cache when adding custom weapon
* Can’t edit weapons
* Weapon equip system is not good, needs overhaul, and simplification
* Equipping a two handed weapon in right hand greys out left hand (which is good, but you should still be able to add weapons to that slot)
* Brewing mixture error should say “cannot mix multiple types” not just bombs and elixirs
* When mixing elements, can select an already selected element adding an extra one. If there are more than one of the element it takes the second. This occurs only on tapping the first of a pair (obviously) and so when making a pair, selecting the already selected one should unselect it. Probably need debounce or something as well. 
* Deleting herbs doesn’t change anything
* You can change armor both in the character sheet and the character settings. Shouldn’t be able to do it in settings
* Cannot change race, class background, order or vocation in the character settings
* Character identity formatting is really bad. It’s like_native_Knight, all lowercase not at all.
* Should be able to multi class
* Entire character setting page is just really fucking bad and it was missing options in his styled really poorly
* Settings page only shows cancel button as option to leave which sucks it should have a back button and once you save it should be back not cancelled because cancel makes it seem like you’re discarding changes.
* Foraging modifier should be based off of a nature skill role, not off of a other secondary herbalism modifier so that needs to be updated
* Number of max foraging sessions is not increased by intelligence modifier it should be equal to intelligence modify minimum of one

# Changes
* Make custom weapon properties check boxes
* Reset character
* Better organization of brewed inventory
* Better organization of equipped weapons
* Ammo tracking
* Ability to combing arrows and (bomb) elixirs to create special arrows
* Move skill proficiencies to character bar
* Things in character bar like race, order, background, vocations, etc. Should have an animation that clicking them pops up a small modal explaining that thing
* On stackable effects instead of asterisk make it like highlighted with a hover info modal instead
* Should be able to select brew from recipe menu to take you to brew menu
* We’re gonna make the profile the main page with tabs to connect to other sections (inventory, vocation, archemancy, martial mastery, spellcasting, etc.)
* Selecting an herb in your herb inventory should bring up an informational modal to give detail details about that specific herb
* Need to add archemancy
* Need to add martial mastery
* Need to add spellcasting expansion
* need to be able to add herbs to inventory without foraging (for cases where e.g. dm awards herbs, another player gives them, you buy them, etc.)
* inventory system is a bit allover the place rn too, style and function