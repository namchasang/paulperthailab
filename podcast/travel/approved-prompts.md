# Nara travel photos: approved images and the prompts that made them

Paul approved these as natural-looking (6 Nov 2026). Made in Gemini (image). Every post is labelled "สร้างด้วย AI".
Images are in Nara Studio > Library. Face reference for all new travel photos: `00-NARA-MAIN-FACE.png` (Nara Studio asset 63f0a5c6…).

## What made them work
- Candid or selfie, not posed: mid-step, looking at something, laughing.
- Phone look (iPhone wording), deep focus, no bokeh, real daylight from the location photo. Never: 50mm, 35mm, full-frame, shallow depth of field, rim light, editorial, cinematic, professional.
- Say her age and figure: "a young Thai-Malaysian woman in her late twenties, about 27 years old, with a soft, curvy, healthy figure, a fuller bust and hips, natural and not skinny; her clothes fit her curves naturally and stay modest and elegant".
- Light and shadow direction copied from the real photo; her shadow goes the same way as the scene's shadows.
- Size check: heads of people of the same height line up in an eye-level photo. Selfies and waist-up shots avoid the problem; full-body shots usually look wrong (proportions, pose, light).
- Poses that failed: full-body golf swing finish; leaning out of a train window (Busselton Jetty train, dropped 6 Nov 2026). Prefer standing or sitting poses on solid ground.
- A location photo where a real person is the main subject (e.g. Twelve Apostles): Gemini puts Nara in that person's exact spot and pose; moving her or leaning on a fence made her float. Use a selfie for those photos instead.
- A body reference image also pulls the FACE toward its own face. Use a body reference with the head cropped off (00-NARA-FULLBODY-REF.png is headless).
- Wide shots with a tiny face drift from Nara's face: upscale first, then edit only the face with the main face image.
- To copy a pose from a photo with people: step 1 removes them; step 2 uses the cleaned photo as the scene AND the original as a pose-only reference ("put her exactly where the woman with … is, copy that pose, do not copy her face, hair or clothes").
- Fix once or twice at most; if still wrong, start again from the original location photo.
- Outfits: many colours to suit the place, bright natural colours; keep long dark hair and small gold earrings.
- Photos with children or other people: step 1 removes them in a prompt of its own ("Remove the people in the aisle. Fill the space with the matching floor and background. Keep everything else exactly the same."); step 2 adds Nara to the cleaned photo. Gemini refused when the location photo showed a child's face clearly (Busselton train, 6 Nov 2026): crop or clean the photo first.
- Remove children and clear strangers' faces. No memorials. No climbing landmarks. No brand logos.

---

## 1. London Court, Perth: selfie  ★
Images: (1) Nara face portrait (2) full-body outfit (3) `11-london-court.jpg`
```
Image 1 is her face, image 2 is her outfit, image 3 is the real location. Create a selfie she takes with her phone at arm's length in front of the Tudor-style building in image 3. She is in the lower front of the frame from the chest up, smiling happily, head tilted a little. Behind her, the building with the clock and arch from image 3, slightly soft-focused, same cloudy sky. Soft overcast daylight on her face, natural skin texture, slight wide-angle phone selfie look, vertical 9:16, photorealistic. Keep the building, clock and signs as in image 3.
```

## 2. Gelato shop: selfie (this is now Nara's MAIN FACE)  ★
Images: (1) Nara face portrait (2) full-body outfit (3) `10-gelato-shop.jpg`
```
Image 1 is her face, image 2 is her outfit, image 3 is the real gelato shop. Create a real phone selfie taken by her inside this shop:
- She stands on the customer side, in front of the counter, close to the camera. Her face and shoulders fill the lower half of the frame, chest up. Her phone arm reaches out of the frame toward the camera.
- With her free hand she holds a gelato cone up next to her cheek, taking a small lick with a playful wink.
- Behind her, a little above her head, the white wall with the black menu boards from image 3, softly out of focus. The counter is behind her, not around her. Remove the staff member completely.
- Lighting matches the shop: bright light from the pendant lamps above, a soft highlight on the top of her hair and her forehead, gentle shadows under her brows, nose and chin, the cone casting a small shadow on her hand. The background is a little brighter and softer than her face, as in a real phone selfie.
- Wide-angle front-camera look: her arm and shoulder nearest the camera look slightly bigger, the shop wall slightly curved at the edges.
Photorealistic, natural skin texture, vertical 9:16.
```
Then one fix for the face (images: face portrait + the result):
```
Edit only her face and expression. Keep the shop, her pose, the selfie arm, the cone, her outfit and the lighting exactly the same.
She is a young Thai-Malaysian woman in her late twenties, about 27 years old. Make her face match the reference portrait exactly: same face shape with soft full cheeks, same eyes, nose, lips, eyebrows and warm smile, youthful smooth skin with natural texture. Change the expression to a natural one: both eyes open and smiling, the gelato cone held right at her lips as if she is about to take a bite, a happy closed-mouth smile.
```

## 3. Lancelin sand dunes: on the ATV  ★
Images: (1) Nara face portrait (2) `12-lancelin-atv.jpg`
```
Image 1 is her face. Image 2 is the real location at the Lancelin sand dunes, Western Australia. She is a young Thai-Malaysian woman in her late twenties, about 27 years old, with the exact face from image 1, sporty and confident.

Remove the child completely. Replace the small blue kids' quad bike with a full-size adult blue ATV in the same place and at the same angle. Keep everything else from image 2: the white sand, the other parked ATVs behind, the distant dunes, the people far away and the cloudy sky.

She sits on the blue ATV, turned toward the camera over her shoulder just like the pose in image 2, one gloved hand on the handlebar, laughing with a big happy smile. She wears an open-face white helmet with goggles pushed up on it so her face is clear, a fitted light khaki long-sleeve shirt, dark cargo pants, riding gloves and boots. A few strands of dark hair blow across her cheek, a little sand dust on her boots and the bike.

Soft overcast daylight like image 2, gentle even light on her face, no hard shadows, a soft shadow under the ATV on the sand. No brand logos on the bikes or clothes. Photorealistic, natural skin texture, phone photo, vertical 3:4.
```

## 4. Beach by the jetty: walking, candid  ★
Images: (1) Nara face portrait (2) full-body outfit. Scene made by AI (Thomson Bay style).
Step 1:
```
Image 1 is the face reference: keep her exact face, defined eyebrows, warm smile, fuller lips, light natural makeup, small gold earrings, and long dark hair with soft volume and gentle waves moving in the breeze. Image 2 is the outfit reference: same cream silk blouse, beige wide-leg trousers, white sneakers and tan crossbody bag.

She walks slowly along the white sand at Thomson Bay on Rottnest Island, Western Australia, late afternoon golden hour. Turquoise clear water, a wooden jetty and small boats in the background, soft warm sunlight from the side, a gentle rim light on her hair, natural shadow on the sand. She looks toward the camera with a relaxed, happy smile, one hand holding the bag strap.

Vertical 9:16, framed from head to knees so her face is clear. Photorealistic travel photo, natural skin texture, shallow depth of field, shot on a full-frame camera with a 50mm lens, rich but natural colours.
```
Step 2 (made it candid):
```
Keep the same woman, same face, hair, outfit and the same beach, jetty and boats. Make it a natural candid travel photo instead of a posed one:
- Camera at a slight three-quarter angle, she is mid-stride walking toward the camera-left, body turned a little, shoulders and hips naturally uneven with the step.
- One foot forward with the heel just touching the sand, the back foot lifting off, arms moving naturally: one hand lightly on the bag strap, the other relaxed with a soft bend at the elbow.
- She glances to the side toward the water with a soft laugh, not looking straight into the camera.
- The sea breeze moves both her hair and the loose fabric of her trousers and blouse.
- Her sneakers sink slightly into the soft sand, with a trail of her own footprints behind her.
- Low golden sunlight from the side lights her the same way as the scene, warm rim light on her hair and one side of her face, her shadow stretching long across the sand in the same direction as the other shadows.
Photorealistic, natural skin texture, shot on a 50mm lens, slight motion in the hair, vertical 9:16.
```
(Made before the phone-look rule; it still worked. Do not ask a still image to make fabric blow: it went wrong.)

## 5. The Pinnacles: hand on the limestone, phone look  ★ (best phone look so far)
Images: (1) `00-NARA-MAIN-FACE.png` (2) an earlier Pinnacles result for the outfit (3) `14-pinnacles.jpg`
```
Image 1 is her face. Use ONLY her face, hair and earrings from image 1. Image 2 shows her outfit (white linen shirt, beige linen trousers, straw hat). Image 3 is the real location: keep every pillar, the sand and the sky exactly as in image 3.

She stands right beside the large pillar on the left in image 3, her body turned slightly toward it, resting her palm lightly on the rough limestone at shoulder height, fingers relaxed, looking up along the pillar with a calm, curious smile. Her other arm hangs relaxed. The hat stays on her head, she does not hold it.

Shot on an iPhone main camera by a friend standing a few metres away: casual travel snapshot, not a professional photo. Deep focus, she and the background are both sharp, no bokeh. Bright HDR phone look with lifted shadows, vivid sky and natural punchy colours, slight phone sharpening. Real daylight as in image 3, harsh sun from the upper right, hard shadows falling to the lower left. Slightly off-centre framing, natural skin texture, no retouching. Correct hands with five fingers, vertical 9:16.
```
Optional fix: `Remove the person-shaped shadow on the sand at the lower right. Replace it with plain golden sand with the same ripples. Keep everything else exactly the same.`

## 6. Indoor golf simulator: waist up, club on the shoulder  ★
Images: (1) `00-NARA-MAIN-FACE.png` (2) `15-golf-simulator.jpg`
(The full-body swing finish failed: stretched legs, model pose, club on the wrong side, studio light. Waist up fixed it.)
```
Image 1 shows her face. Use ONLY her face, hair and earrings from image 1: same face shape, eyes, nose, lips, smile and long dark hair. Ignore the shop, the gelato, the outfit and the pose in image 1. She is a young Thai-Malaysian woman in her late twenties, about 27 years old.

Image 2 is a real indoor golf simulator bay. Remove the child, the golf bag and the clubs on the floor. Change "COOPER" on the screen to "NARA". Remove the brand logo on the projector, the course name and the red "INVALID SHOT" box.

Framed from the waist up: she stands in front of the big golf screen with the fairway and her shot numbers, the driver resting casually on her right shoulder like a bat, holding the grip with her gloved hand. She has just hit a good shot and turns back toward the camera, laughing with a proud, happy face. She wears a fitted cream polo shirt, a white golf glove, small gold earrings, her hair in a high ponytail. No brand logos.

Shot on an iPhone main camera by a friend standing close behind her: casual snapshot, deep focus, the screen and she are both sharp, no bokeh. Real room light: the bright screen behind her puts a soft glow on her hair and shoulders, her face lit softly by the light in the room, the walls dim. Natural skin texture, no retouching, correct hands with five fingers, vertical 9:16.
```

## 7. Indoor golf simulator: selfie holding the driver up  ★ (first one with the curvy-figure line)
Images: (1) `00-NARA-MAIN-FACE.png` (2) `15-golf-simulator.jpg`
```
Image 1 shows her face. Use ONLY her face, hair and earrings from image 1: same face shape, eyes, nose, lips, smile and long dark hair. Ignore the shop, the gelato, the outfit and the pose in image 1. She is a young Thai-Malaysian woman in her late twenties, about 27 years old, with a soft, curvy, healthy figure, a fuller bust and hips, natural and not skinny; her clothes fit her curves naturally and stay modest and elegant.

Image 2 is a real indoor golf simulator bay. Remove the child, the golf bag and the clubs on the floor. Change "COOPER" on the screen to "NARA". Remove the brand logo on the projector, the course name and the red "INVALID SHOT" box.

She takes a selfie with her phone at arm's length, chest up, the big golf screen with the fairway and her shot numbers behind her. She holds the driver up beside her head in her free hand like a trophy, laughing with raised eyebrows as if saying "did you see that?". Fitted cream polo shirt, white golf glove, small gold earrings, high ponytail. No brand logos.

Shot on an iPhone front camera: everyday selfie, the screen as sharp as her face, no bokeh. Real room light: the glowing screen behind her lights the edges of her hair and shoulders, her face lit by the phone-side light in the room, the walls around dark. Slightly tilted framing, natural skin texture, no retouching, correct hands with five fingers, vertical 9:16.
```

## 8. Asian grocery, Northbridge: picking noodles, candid  ★
Images: (1) `00-NARA-MAIN-FACE.png` (2) `17-northbridge-asian-grocery.jpg`
```
Image 1 shows her face. Use ONLY her face, hair and earrings from image 1: same face shape, eyes, nose, lips, smile and long dark hair. Ignore the shop, the gelato, the outfit and the pose in image 1. She is a young Thai-Malaysian woman in her late twenties, about 27 years old, with a soft, curvy, healthy figure, a fuller bust and hips, natural and not skinny; her clothes fit her curves naturally and stay modest and elegant.

Image 2 is a real Asian grocery store in Northbridge, Perth: keep the long aisle, the packed shelves on both sides, the red paper lantern and the tiled floor. Remove the child and the adult walking in the aisle.

A candid photo from the waist up: she stands beside the shelf on the left, reaching up to take a pack of instant noodles, turned three-quarters toward the camera, looking at the pack in her hand with a happy, nostalgic smile like she has found a taste of home. A shopping basket with a bubble milk tea cup and snacks hangs on her other arm. The pack in her hand, the cup and the basket items have plain packaging with no brand names.

She wears a soft lilac knit cardigan over a white T-shirt, light-wash jeans, small gold earrings, her long dark hair loose.

Shot on an iPhone main camera by a friend standing in the aisle: casual snapshot, deep focus, she and the shelves are both sharp, no bokeh. Real store light: cool white ceiling lights from above, no sunlight. Slightly off-centre framing, natural skin texture, no retouching, correct hands with five fingers, vertical 9:16.
```
Optional fix before posting: `Make the noodle pack in her raised hand plain, with no brand names or logos. Keep everything else exactly the same.`

## 9. Twelve Apostles, Great Ocean Road: selfie in the wind  ★
Images: (1) `00-NARA-MAIN-FACE.png` (2) `00-NARA-FULLBODY-REF.png` (3) `18-twelve-apostles.jpg`
(Replacing the man in the photo failed twice: stiff pose, then floating against the fence. The selfie worked first time. Gemini redrew the stacks a little.)
```
Image 1 shows her face: use ONLY her face, hair and earrings from image 1. Image 2 shows her body: use ONLY her body shape and proportions from image 2. Ignore the outfits, poses and backgrounds in images 1 and 2. She is a young Thai-Malaysian woman in her late twenties, about 27 years old, with a soft, curvy, healthy figure, a fuller bust and hips, natural and not skinny; her clothes fit her curves naturally and stay modest.

Image 3 is the real location, the Twelve Apostles on the Great Ocean Road, Victoria. Remove the man in black and all the tourists. Keep the limestone stacks, the surf, the cliffs and the misty sky.

She takes a selfie with her phone at arm's length on the wooden viewing path, chest up, the rock stacks and the sea behind her over her shoulder. The wind blows her hair across her face and she laughs while pushing it back with her free hand. She wears a soft brick-red wool coat over a cream knit sweater, small gold earrings. No brand logos.

Shot on an iPhone front camera: everyday selfie, deep focus, the rock stacks sharp behind her, no bokeh. Soft grey misty daylight, even light on her face. Slightly tilted framing, natural skin texture, no retouching, correct hands with five fingers, vertical 9:16.
```

## 10. Bondi Beach lookout, Sydney: leaning on the railing, wide original framing  ★
Step 1, only `19-bondi-beach.jpg`:
```
Remove the two people standing at the railing and the person at the lower right edge. Fill the space with the matching metal railing, the beach, the sea and the paved lookout floor. Keep everything else exactly the same.
```
Step 2, images: (1) `00-NARA-MAIN-FACE.png` (2) a body reference (Paul used a slimmer one; the face came back like Nara. Now use the headless `00-NARA-FULLBODY-REF.png`) (3) the cleaned photo
```
Image 1 shows her face: use ONLY her face, hair and earrings from image 1. Image 2 shows her body: use ONLY her body shape and proportions from image 2. Ignore the outfits, poses and backgrounds in images 1 and 2. She is a young Thai-Malaysian woman in her late twenties, about 27 years old, with a soft, curvy, healthy figure, a fuller bust and hips, natural and not skinny; her clothes fit her curves naturally and stay modest.

Image 3 is the real location, the clifftop lookout above Bondi Beach in Sydney. Keep image 3 exactly as it is: the same horizontal 4:3 frame, the same wide camera angle and distance, the same crop, the whole curve of the beach, the sea, the headland, the long metal railing across the front and the paved floor. Do not zoom in, do not crop, do not change the frame to vertical.

Add her standing on the paved lookout in the middle of the frame, at the railing, exactly where the paving meets the railing in the centre. She is seen full body from head to shoes, the same small size in the frame as a person standing there would be: the top rail reaches just above her waist. Her near hand rests on the top rail with her fingers wrapped around it, her other hand holds her sunglasses, weight on one leg, body turned slightly toward the beach, smiling at the camera, the breeze lifting her long dark hair.

She wears a sunny yellow lightweight zip jacket over a white T-shirt, light-wash jeans, white sneakers, small gold earrings. No brand logos.

Match the light of image 3: bright clear sunshine, the same shadow direction as the railing posts, a soft shadow under her shoes on the paving. Shot on a phone main camera like image 3: deep focus, everything sharp, no bokeh, natural colours, natural skin texture, no retouching, correct hands with five fingers.
```
Before posting: `Remove the person at the lower right corner. Fill the space with the matching grass, rocks and railing. Keep everything else exactly the same.`
(Lesson: full body works when the original camera framing is locked, a real object like the railing sets her size, and she touches it.)

## 11. Hunter Valley restaurant, NSW: steak and red wine, seated  ★
Step 1, only `20-hunter-valley-steak.jpg`:
```
Remove the man sitting at the table and the woman sitting in the background on the left. Fill the space with an empty wooden chair and the matching sandstone wall, window and restaurant behind. Keep the table, the steak plate, the wine glass, the water glasses, the light and the camera angle exactly the same.
```
Step 2, images: (1) `00-NARA-MAIN-FACE.png` (2) `00-NARA-BODY-REF.png` (3) the cleaned photo
```
Image 1 shows her face: use ONLY her face, hair and earrings from image 1. Image 2 shows her body: use ONLY her body shape and proportions from image 2. Ignore the outfits, poses and backgrounds in images 1 and 2. She is a young Thai-Malaysian woman in her late twenties, about 27 years old, with a soft, curvy, healthy figure, a fuller bust and hips, natural and not skinny; her clothes fit her curves naturally and stay modest.

Image 3 is a real restaurant in the Hunter Valley wine region, New South Wales: keep the sandstone wall, the framed pictures, the window and the soft restaurant behind, the wooden table, the plate with the grilled steak and corn, the glass of red wine and the water glasses exactly the same, and keep the vertical frame and camera angle.

A candid photo taken by a friend sitting across the table: she sits on the chair behind the table, both forearms resting on the wooden table, leaning forward a little. One hand holds the stem of the wine glass on the table, and she smiles warmly at the camera with sparkling, happy eyes, as if saying "this looks amazing". Her long dark hair falls over one shoulder.

She wears a dusty rose silk blouse with the sleeves rolled up, small gold earrings. No brand logos.

Real light of the restaurant: soft daylight from the window on the right lighting the side of her face, warm indoor light from above, the sandstone wall glowing warm behind her. Shot on an iPhone by a friend: casual snapshot, she and the plate both sharp, the restaurant behind a little soft as in image 3. Natural skin texture, no retouching, correct hands with five fingers.
```
(Seated at a table works well: forearms on the table anchor her. Caption: no restaurant name, focus on the food, not the wine.)

## 12. Wildlife park: holding a wombat, emus behind  ★ (Paul: "สมจริงมาก")
Images: (1) `00-NARA-MAIN-FACE.png` (2) `00-NARA-FULLBODY-REF.png` (headless) (3) `22-wombat-hold.jpg`
(The location photo is a close-up of a real woman, so the prompt makes a NEW photo and uses image 3 only for the wombat, the hold and the setting. Some parks do let visitors hold wombats. Never name the park.)
```
Image 1 shows her face: use ONLY her face, hair and earrings from image 1. Image 2 shows her body: use ONLY her body shape and proportions from image 2. Ignore the outfits, poses and backgrounds in images 1 and 2. She is a young Thai-Malaysian woman in her late twenties, about 27 years old, with a soft, curvy, healthy figure, a fuller bust and hips, natural and not skinny; her clothes fit her curves naturally and stay modest.

Image 3 is a reference for the wombat, the way it is held and the setting: use the same big fluffy brown wombat, held upright against her chest the same way, one arm around its chest and one hand supporting it from underneath, the same wildlife park with the wooden fence, the emus behind it, the pond and the grassy hill under a cloudy sky. Do not copy the person in image 3: create a new photo of her.

A candid photo taken by a friend, framed from the thighs up: she stands on the grass in front of the fence, holding the wombat close, her cheek tilted slightly toward it, smiling brightly at the camera, her long dark hair moving a little in the breeze. The wombat's claws rest gently on her arm.

She wears a cobalt-blue knit cardigan over a white T-shirt, white jeans, small gold earrings. No brand logos.

Soft overcast daylight like image 3, even light on her face and the wombat's fur. Shot on an iPhone main camera: casual snapshot, deep focus, she, the wombat and the emus behind all sharp, no bokeh. Natural skin texture, no retouching, correct hands with five fingers, vertical 3:4.
```
(First result with the headless body reference: face and figure both right.)

## 13. Wildlife park: crouching and patting kangaroos  ★
Step 1, only `23-kangaroos.jpg`:
```
Remove all the people: the three people crouching on the grass and the people walking in the background. Keep both kangaroos exactly as they are, the kangaroo lying on the grass and the kangaroo grazing in front, and fill the empty space with the matching green grass, trees and fence. Keep the light and the camera angle exactly the same.
```
Step 2, images: (1) `00-NARA-MAIN-FACE.png` (2) `00-NARA-FULLBODY-REF.png` (3) the cleaned photo (4) `23-kangaroos.jpg` (the original, as the POSE reference)
(Without image 4 Gemini zoomed in, dropped the grazing kangaroo and changed her crouch. Adding the original as a pose reference fixed it.)
```
Image 1 shows her face: use ONLY her face, hair and earrings from image 1. Image 2 shows her body: use ONLY her body shape and proportions from image 2. Ignore the outfits, poses and backgrounds in images 1 and 2. She is a young Thai-Malaysian woman in her late twenties, about 27 years old, with a soft, curvy, healthy figure, a fuller bust and hips, natural and not skinny; her clothes fit her curves naturally and stay modest.

Image 3 is the scene to use: keep it exactly as it is, the same square frame, the same camera height and angle, the same wide lawn, trees, fence and sky, the kangaroo lying on the grass in the middle distance and the kangaroo grazing in the front. Do not zoom in, do not move or resize the kangaroos.

Image 4 is the reference for her pose and position only: put her exactly where the woman with pink hair is in image 4, at the same size in the frame and the same distance from the camera. Copy that woman's pose exactly: crouching low, knees together, sitting back almost on her heels, leaning forward, both palms resting flat on the back of the lying kangaroo, head up looking at the camera with a big laugh. Do not copy that woman's face, hair or clothes, and do not add the other people from image 4.

She wears a coral-orange knit sweater, light-wash jeans, white sneakers, small gold earrings, her long dark hair loose. No brand logos.

Same sunshine and shadows as image 3, her soft shadow on the grass. Shot on an iPhone main camera: casual snapshot, deep focus, she and both kangaroos sharp, no bokeh. Natural skin texture, no retouching, correct hands with five fingers.
```
(Result: she pats the grazing kangaroo instead, in the right-hand spot. Paul kept it.)

## 14. Brighton Bathing Boxes, Melbourne: red knit dress, leaning on the door  ★
Step 1, only `24-brighton-bathing-boxes.jpg` (has a child: always clean first, in its own prompt):
```
Remove all five people. Fill the space with the matching sand, the bathing boxes and their wooden decks. Keep the blue-and-yellow box number 6, the white-and-teal box number 7, the striped box on the right, the trees and the blue sky exactly the same.
```
Step 2, images: (1) `00-NARA-MAIN-FACE.png` (2) `00-NARA-FULLBODY-REF.png` (3) the cleaned photo
```
Image 1 shows her face: use ONLY her face, hair and earrings from image 1. Image 2 shows her body: use ONLY her body shape and proportions from image 2. Ignore the outfits, poses and backgrounds in images 1 and 2. She is a young Thai-Malaysian woman in her late twenties, about 27 years old, with a soft, curvy, healthy figure, a fuller bust and hips, natural and not skinny.

Image 3 is the real location, the colourful bathing boxes at Brighton Beach in Melbourne: keep the blue-and-yellow box, the white-and-teal box, the striped box, the trees, the sand and the clear blue sky exactly the same, and keep the vertical frame and camera angle.

A candid photo taken by a friend, framed from the knees up: she leans one shoulder against the white-and-teal bathing box, one hand resting on the wooden door frame, one knee bent, hips turned slightly, smiling confidently at the camera with her long dark hair falling over one shoulder.

She wears a fitted, figure-hugging red knit mini dress with an off-the-shoulder neckline that flatters her curves, knee-high brown leather boots, small gold earrings, a slim gold bracelet. Chic, confident and stylish, still tasteful. No brand logos.

Bright clear sunshine from the front left, crisp light on her face and shoulders, her shadow falling on the box behind her. Shot on an iPhone main camera: casual snapshot, deep focus, she and the bathing boxes sharp, no bokeh. Natural skin texture, no retouching, correct hands with five fingers, vertical 3:4.
```
Step 3, the body came out model-thin; images: (1) main face (2) full-body ref (3) the result
```
Edit only her body shape. Keep her face exactly like image 1, and keep her pose, the red off-the-shoulder knit mini dress, the brown boots, her hair, the bathing boxes, the sand, the sky and the light in image 3 exactly the same.

Give her the same body as image 2: a soft, curvy, healthy figure, fuller bust and hips, a gently defined but not tiny waist, fuller thighs and calves, softer and fuller arms, natural and not skinny, not a model's figure. Natural leg length for a woman about 160 cm tall, shorter and fuller legs than now. The knit dress stretches naturally over her curves.

Natural skin texture, no retouching, same phone photo look.
```
(Lesson: fitted or short outfits pull Gemini to a thin model body. Add "not a model's figure" and name thighs, calves and arms from the start. Use "flattering, figure-hugging, confident" instead of the word sexy.)

## 15. Indoor tennis court: sitting on the bench, knees up, holding the racket out  ★ (Paul: "พอใจแล้ว")
Step 1, only the tennis photo (people in the background):
```
Edit this photo: remove the woman sitting on the bench, the person standing at the far left edge, and every person on the courts in the background. Fill in the wooden bench, the green umpire chair, the clay court, the net and the background naturally, matching the original texture, light and shadows. Also remove any brand logos on the net posts. Keep everything else exactly the same: the curved roof, the court, the tennis balls, the camera angle and the framing. Photorealistic, no other changes.
```
Step 2, images: (1) `00-NARA-MAIN-FACE.png` (2) `00-NARA-FULLBODY-REF.png` (3) the cleaned photo (4) the original photo as the exact POSE and OUTFIT reference
(The first try described a new outfit and only a rough pose: Gemini sat her upright, legs down, with a giant racket. Copying pose and outfit exactly from image 4, then changing one item later, fixed it.)
```
Use image 1 for her face and hair, image 2 for her body shape, image 3 as the exact background and framing, and image 4 as the exact pose AND outfit reference (copy the pose and clothes exactly, but not that person's face, hair or body).

Place the same woman from image 1 into image 3: a Thai-Malaysian woman about 27, mature adult face, long straight black hair with soft see-through bangs, hair down.

Pose, exactly as image 4: she sits near the front edge of the wooden bench, leaning back slightly. Both knees are bent and raised high, close together, thighs angled up toward the camera, her heels resting on the front edge of the bench with her feet in the lower left of the frame. Her right arm is stretched out to the upper left, holding the tennis racket by the grip with the racket upright beside the green umpire chair. Her left arm is straight and her left hand rests flat on the bench behind her hip. Head tilted slightly, eyes happily squeezed shut, a sweet closed-lip smile.

Racket: a normal real-size adult tennis racket, red frame, not oversized. The racket head is about as wide as her shoulders and sits at the same place in the frame as in image 4. No logos.

Outfit, exactly as image 4: a fitted white short-sleeve crew-neck T-shirt, black athletic shorts, white crew socks with a small pink ribbon print, white running sneakers with silver details and no logos, a white smartwatch, a black hair tie on her wrist.

Body as in image 2: soft, curvy and healthy, fuller bust and hips, fuller thighs, not a model's figure, not skinny.

Soft daylight under the curved roof, warm reflected light from the clay court, natural shadows matching the scene. Her size must match the bench exactly as in image 4.
Shot on iPhone, wide lens, deep focus, everything sharp, natural HDR, no bokeh, real phone photo look, not studio lighting.
```
Step 3, swap the shorts for a skirt (same chat, attach the result):
```
Edit this image only. Replace the black shorts with a short white pleated tennis skirt with built-in shorts underneath (a tennis skort), soft fabric that drapes naturally over her raised knees and thighs, tasteful. Also remove the logos from the sneakers so they are plain white with silver details.

Keep everything else exactly the same: her face, hair, smile, pose, body, the white T-shirt, the socks, the racket, the lighting, the background and the framing. Real iPhone photo look, deep focus, no bokeh.
```
(Lesson: for a tricky seated pose, copy pose AND outfit from the original first, then change one clothing item per edit. With knees up, use a skort, not a plain short skirt.)

## Lesson (7 Nov 2026): face looked old
- Using the golf selfie as the FACE source plus "mature adult face" made her look 35+.
- Face always from `00-NARA-MAIN-FACE.png` (gelato). Golf selfie = body only ("use ONLY her body shape, not her face").
- Write "about 27, a fresh youthful face with smooth natural skin" instead of "mature adult face".
- Any reference photo with a face (outfit photos too) pulls her face: crop the head off first.
