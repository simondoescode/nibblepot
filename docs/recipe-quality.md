# Recipe quality review — 1 November 2026

This is an editorial/data audit of recipes for a **UK family of four**, not a physical kitchen trial or a nutrition certification. Timings include basic preparation and can vary with oven and ingredient size. Always follow packet instructions and check that food is cooked through.

## Original 16 recipes audited
- **One-pot chicken rice:** specific 650 ml stock liquid, timed simmer and thorough chicken cooking; remove "enough water" ambiguity.
- **Egg fried rice:** increase 15→25 minute total to account for cooking dry rice; give safe chilled-rice alternative.
- **Chicken traybake:** 55-minute total, vegetables first, cook chicken thoroughly.
- **Jacket potatoes / chilli jackets:** 65-minute total including 50–60-minute oven bake; chilli jackets not genuinely one-pot.
- **Tuna pasta bake:** add cream cheese to bind 250 ml milk into a sauce.
- **Cottage pie:** specify 300 ml gravy water and realistic potato boil/grill stages.
- **Tomato pasta and soup:** correct multi-pan classifications.
- **Toasties and fish finger sandwiches:** replace vague butter/lettuce quantities with measurable units.
- **Sausage casserole, meatballs and mash:** check meat is fully cooked, not merely browned.
- **Butter bean stew:** specify 150 ml stock liquid.

## Fourteen new recipes
Sausage traybake, cheat’s chicken pie, tuna jackets, creamy chicken rice, broccoli pasta, smoky bean rice, chicken wraps, sausage pasta, veggie wraps, egg noodles, fish and wedges, beef chilli, lentil soup and chickpea curry. Six newly tracked ingredients (puff pastry, broccoli, red lentils, chickpeas, frozen spinach and curry powder) complement staples already in the catalogue. Original recipe IDs and storage keys are unchanged.

## Quantities and shopping
All 30 ingredient lists have parseable four-serving numeric quantities and supported units, including pastry sheets and leaves. The shopping list adds matching measurement units across recipes and gives a *whole pack* hint when a tin or pastry sheet is fractional. It never assumes tin weights, converts whole potatoes to grams, or subtracts unknown larder stock quantities. Original recipe photos are preserved; fourteen unique local SVG illustrations are provided for new recipes.

## Food safety basis
Food Standards Agency references:
- https://www.food.gov.uk/safety-hygiene/cooking-your-food — cooking poultry, pork/mince, core time/temperature alternatives (e.g., 75°C for 30 seconds), reheating leftovers only once and refrigerating promptly.
- https://www.food.gov.uk/safety-hygiene/home-food-fact-checker — cooked rice: cool quickly (ideally within an hour), refrigerate, use within 24 hours and reheat only once.
- https://www.food.gov.uk/safety-hygiene/cooking-your-food — other leftovers: refrigerate within two hours, use within 48 hours or freeze, and reheat until steaming hot.

These notes are also shown on individual recipe pages and in Cooking Mode. Review date indicates editorial review, not independently verified cooking outcomes.

## Automated quality gate
`tests/recipeQuality.test.ts` checks preservation of the original 16 IDs, 30 unique recipes, safe storage notes, numeric/parseable ingredient measures, valid ingredient references, shareable routes and the presence of local artwork. Existing shopping, routing, planner, and mobile tests remain required in CI.
