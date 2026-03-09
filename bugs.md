issues on brew page:

1. Console Error
Encountered two children with the same key, `4`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.

src/components/brew/HerbSelector.tsx (160:17) @ SelectedHerbsSummary/<.children<.children<.children<

  158 |               const qty = selectedQuantities.get(item.id) || 0
  159 |               return (
> 160 |                 <div
      |                 ^
  161 |                   key={item.id}
  162 |                   className="px-3 py-1.5 bg-purple-900/50 border border-purple-700 rounded-lg text-sm flex items-center gap-2"
  163 |                 >

Call Stack 25
Show 21 ignore-listed frame(s)
div
unknown (0:0)
SelectedHerbsSummary/<.children<.children<.children<
src/components/brew/HerbSelector.tsx (160:17)
SelectedHerbsSummary
src/components/brew/HerbSelector.tsx (157:28)
BrewPage

2. Console Error
Encountered two children with the same key, `4`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.

src/components/brew/HerbSelector.tsx (160:17) @ SelectedHerbsSummary/<.children<.children<.children<

  158 |               const qty = selectedQuantities.get(item.id) || 0
  159 |               return (
> 160 |                 <div
      |                 ^
  161 |                   key={item.id}
  162 |                   className="px-3 py-1.5 bg-purple-900/50 border border-purple-700 rounded-lg text-sm flex items-center gap-2"
  163 |                 >

Call Stack 25
Show 21 ignore-listed frame(s)
div
unknown (0:0)
SelectedHerbsSummary/<.children<.children<.children<
src/components/brew/HerbSelector.tsx (160:17)
SelectedHerbsSummary
src/components/brew/HerbSelector.tsx (157:28)
BrewPage
src/app/brew/page.tsx (363:11)


On Character Wizard:

1. Console Error
Encountered two children with the same key, `4`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.

src/components/brew/HerbSelector.tsx (160:17) @ SelectedHerbsSummary/<.children<.children<.children<

  158 |               const qty = selectedQuantities.get(item.id) || 0
  159 |               return (
> 160 |                 <div
      |                 ^
  161 |                   key={item.id}
  162 |                   className="px-3 py-1.5 bg-purple-900/50 border border-purple-700 rounded-lg text-sm flex items-center gap-2"
  163 |                 >

Call Stack 25
Show 21 ignore-listed frame(s)
div
unknown (0:0)
SelectedHerbsSummary/<.children<.children<.children<
src/components/brew/HerbSelector.tsx (160:17)
SelectedHerbsSummary
src/components/brew/HerbSelector.tsx (157:28)
BrewPage
src/app/brew/page.tsx (363:11)

2. Console Error
Encountered two children with the same key, `4`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.

src/components/brew/HerbSelector.tsx (160:17) @ SelectedHerbsSummary/<.children<.children<.children<

  158 |               const qty = selectedQuantities.get(item.id) || 0
  159 |               return (
> 160 |                 <div
      |                 ^
  161 |                   key={item.id}
  162 |                   className="px-3 py-1.5 bg-purple-900/50 border border-purple-700 rounded-lg text-sm flex items-center gap-2"
  163 |                 >

Call Stack 25
Show 21 ignore-listed frame(s)
div
unknown (0:0)
SelectedHerbsSummary/<.children<.children<.children<
src/components/brew/HerbSelector.tsx (160:17)
SelectedHerbsSummary
src/components/brew/HerbSelector.tsx (157:28)
BrewPage
src/app/brew/page.tsx (363:11)
1
2

3. Console TypeError
NetworkError when attempting to fetch resource.