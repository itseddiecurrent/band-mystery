# Current storyline — baseline before branching

2026-11-23 · Author reference · Spoilers

This organizes the existing single storyline from `场景.txt`, `src/content.mjs`, `src/game.mjs` and `src/evidence_list.mjs`. It describes the current version, not the proposed branches. Where the script and runtime differ, the distinction is explicit.

## 1. What the player experiences

| Stage | Existing scenes and discoveries | What advances the mystery |
| --- | --- | --- |
| Opening | Locke wakes upstairs; recalls backstage arguing and Miko bringing him water at the party | His missing memories and unexplained sleep |
| Arthur | Phone flashlight, broken glass, body examination; left hand holds silver metal and black fragments; optional Arthur phone | Apparent fall, but cause and responsibility uncertain |
| Tony | Wake Tony; inspect milk and his pre-sleep room memory | White powder; missing spare pillow; both phones have no service |
| Lily and yard | Find Lily injured/drowsy near the rear steps; hear her account; inspect her drink | Danzai entered the house first after the noise; an unidentified person opened the door into Lily |
| Missing equipment | Tony reports his broken car window and missing signal blocker | Explains why communication might be blocked; does not identify the thief |
| Search | Bedrooms, shoe, Miko's bag and its four items, Tony's car and nearby tire tracks | Miko's health and earlier injuries; missing people and Willy's departure. Required search discoveries gate Danzai's return |
| Miko | Danzai returns in casual clothes and leads everyone to the cornfield | Miko is alive but unconscious, with a wrist injury and one shoe missing |
| Rescue | Tony stays with Miko; Locke searches the house, finds active blocker in fireplace, switches it off and calls for police/ambulance | Signal returns; rescue becomes possible |
| Danzai's account | Danzai says he shone a phone down from upstairs, saw Arthur, never went downstairs, then heard Willy drive away | A claim to test against Arthur's hand and later forensic findings |
| Police | Miko goes to hospital; police establish suffocation; remove tie clip and compare it with Willy's in the group photo | Fall did not kill Arthur; tie clip links Willy to the fall, not necessarily to the suffocation |
| Willy news | Roadside wall crash; rear wheel detached; Willy died; car and phone recovered | Phone contains records of Willy's repeated abuse of Miko |
| Hospital | Locke and Tony visit; Miko admits sedating Locke and Tony, describes pregnancy and the dispute, and recounts events around the fall | She says Danzai agreed to distract Lily, declared Arthur dead and urged Willy to flee; she describes Willy taking a hammer outside and hearing glass break |
| First reconstruction | Police's provisional account implicates Willy; Locke revisits the fall and missing pillow | Distinguish the fall from the later killing |
| Four review groups | Drinks/autopsy; vehicle; blackmail operation; feather fragments and group photo | Motive, opportunity, drugging, nonfatal fall, vehicle interference and physical contact with Arthur |
| Accusation | Identify Danzai after completing all review groups and required evidence | Wrong selections currently reject and permit further investigation; no separate ending |
| Confrontation | Danzai's denials tested against suffocation, feather costume and his claim never to have gone downstairs | Current final account attributes Arthur's murder and the car tampering to Danzai |
| Reconstruction/arrest | Spare pillow murder; costume damaged; clip put back; pillow and costume destroyed; Danzai attacks and police intervene | Danzai arrested |
| Epilogues | Sunset with Miko; Locke questions what she saw near the car and why she did not warn Willy; later Kate privately questions Miko | Miko's orchestration remains suspected, not proved; final silence |

## 2. Last night's events in the current story

This is the underlying event order, separate from when the player learns it. Some outside movements are not fully timestamped yet.

1. Backstage: Willy and Arthur argue; Danzai, Willy and Arthur's closeness is mentioned.
2. Party / parking opportunity: people go outside at different points. The runtime vehicle-review dialogue allows several people access; the formal script and final confrontation specifically mention Danzai going outside. The current resolution attributes car interference to Danzai.
3. Miko gives Locke sedated water and Tony sedated milk. She says she wants them uninvolved in her meeting. Danzai agrees to distract Lily and supplies her drugged drink.
4. Miko arranges to speak to Arthur first and tells Willy to wait outside until called. The larger background is sustained abuse and the three men's blackmail activity; IP exposure has led Arthur and Willy to prepare to blame Danzai.
5. Willy enters; argument, broken glass, struggle; Arthur slips and falls, pulling Willy's tie clip off with his left hand. The fall leaves him alive and unconscious.
6. Miko and Willy leave the stairs to find a phone. Danzai goes downstairs, takes Tony's spare pillow and suffocates Arthur. Arthur grabs his feathered costume. Danzai restores the tie clip to Arthur's hand, overlooking feather residue under the nails.
7. Danzai tells Miko and Willy that Arthur is already dead and urges Willy to leave. Willy obstructs reporting; Miko describes his hammer, trip to the parking area and breaking glass. **Locke infers Willy stole/activated/hid the blocker; this is an inference based on her account, not an independently witnessed theft.**
8. Willy drives away; his rear wheel comes off and he crashes into a wall. He dies; his phone remains recoverable.
9. Before reporting Miko's location, Danzai destroys the pillow and damaged costume and changes into casual clothes. Miko is later found unconscious in the cornfield; the full truth behind her condition and intentions is not established by her account alone.
10. Locke wakes and begins the investigation.

Lily's current testimony places her with Danzai outside, hearing the argument/noises, then being hit by an opening door and falling from the steps while already drowsy. The door-opener's identity and the precise synchronization of this incident with the murder are not established; do not fill those gaps with assumptions.

## 3. Fact, testimony and suspicion

| Question | Current treatment |
| --- | --- |
| Who killed Arthur? | Final reconstruction: Danzai, with Tony's spare pillow; feather residue contradicts his account |
| Who interfered with Willy's car? | Current resolved storyline: Danzai. Access alone is not proof; the final version needs a coherent supporting evidence chain |
| Who stole the blocker? | Locke suspects Willy from Miko's account; theft, activation and hiding should be distinguished from established physical findings |
| What happened to Willy? | Roadside crash and death, with recoverable vehicle and phone |
| Who sedated whom? | Miko admits sedating Locke and Tony; Danzai's drink to Lily and matching drug findings support his role in sedating her |
| Did Miko engineer everything? | Sunset and Kate's conversation raise suspicions. No definitive confession or proof |

## 4. Continuity issues to resolve when branching

- The baseline hospital scene establishes that Locke and Tony were sedated by Miko. Taking Lily's drink must not erase that without a deliberate rewrite.
- Lily's original discovery, drowsiness, door fall and testimony cannot be reused unchanged in a route where she never consumed the drugged drink.
- The current hospital inference about Willy and the blocker must become conditional on independently selected blocker events.
- Vehicle review, accusation and sunset currently assume Danzai tampered. Rewrite them for Lily and mutual-interruption routes.
- The recovered-phone reveal and later references must disappear from the cliff route. Willy's own testimony becomes possible in the survival route; phone access there is undecided.
- Runtime `review-vehicle` says multiple people went outside; the formal script and current `vehicle` clue summary are more specific about Danzai. Preserve multiple opportunities when rewriting.
- Current formal script proposes three rounds of evidence submissions; runtime primarily uses continuous dialogue after the correct accusation. These are not already branching outcomes.

See [plot-tree.md](plot-tree.md) for the revised branch plan and [plot-tree.svg](plot-tree.svg) for the visual map.
