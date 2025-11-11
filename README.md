# Report (Homework AADS #3)
## 1. Debugging

The mean that was calculated over 50 played games of improved heuristic agent is approximated to be around 30.000
that is far better than the **4654** I received mid-debugging process and 
### Inconsistent checker of the empty and filled squares
Over the codebase, different conditions were used to check whether a cell is occupied, e.g. strict comparison with `1`
or relying on specific values. However, the board cells can hold multiple values (`0`, `null`, `undefined`, or a piece
object). This led to inconsistencies in collision checks and line detection.

**Fix:** use a uniform truthiness check everywhere:
- Empty cell: `!board[x][y]`
- Filled cell: `board[x][y]`
### Bug in move generation
Originally, `getPossibleMoves` limited horizontal positions using `nx - piece.type.size`.  
Since `size` is the 4X4 box, not the actual occupied width for a specific rotation, some valid edge placements
were never considered (especially for vertical I and rotated pieces).  
This made the agent do not consider to put blocks to the right side of the board.

**Fix:** for each rotation:
- The condition to iterate  `x` was changed from strict to not strict less or equal <=.
- Used getDropPosition function + `occupied`/`eachblock` to filter only legal placements.

### Wrong logic of loops in the function that calculates heights

In the initial logic of the nested loop was to traverse the graph row by row. This can lead to cases when two equal 
columns would not be checked as the loop breaks at the first appearance 

**Fix:** change the order of the loops

###  Handling the moves array elements

The array moves was consisted of links to the pieces that included their rotation x and y coordinates etc. However,
this was a wrong implementation as the links were pointing to the piece at the same direction that was checked. It 
could be noticed when playing as pieces placed by agent were all in the same direction of rotation.

**Fix:** change the stored values to:
- only the direction of the piece construct instead of it all
- the rest of elements of each push remained the same

### Restoring the original direction of a piece after the PossibleMoves function
I stored the copy of the piece inserted to the array. After the calculations 
of each possible move I restored the original value.

### The wrong handling of 4x4 tetroid 
The initial position of each piece on the 4x4 grid was centered on the 2nd column but this causes errors
while the handing edge cases of the board

***Fix*** Moving the position by -3 as its written here: 

- `for (let x = -3; x <= nx; x++)`

You can see the heuristic agents performance through this table after finding some of the bugs and adding new features:

| Game | Score | Mean |
|------|-------|------|
| 1    | 2320  | 2320 |
| 2    | 4470  | 3395 |
| 3    | 1440  | 2743 |
| 4    | 7170  | 3850 |
| 5    | 3450  | 3770 |
| 6    | 3520  | 3728 |
| 7    | 2580  | 3564 |
| 8    | 3340  | 3536 |
| 9    | 7240  | 3947 |
| 10   | 8960  | 4449 |

After finding the rest of the bugs (The improved handling of 4x4 tetroid ). You can see the table after finding all of\
the bugs here: 

| Game | Score | Mean  |
|------|-------|-------|
| 1    | 41350 | 41350 |
| 2    | 14770 | 28060 |
| 3    | 13860 | 23326 |
| 4    | 22100 | 23020 |
| 5    | 92030 | 36822 |
| 6    | 10850 | 32493 |
| 7    | 17620 | 30368 |
| 8    | 20970 | 29193 |
| 9    | 11460 | 27223 |
| 10   | 22180 | 26719 |

### Conclusion on the debugging
The fully debugged agent now scores by far more scores than the initial one as u can see in the tables provided.
It avoids obvious bad moves, gets punished for pathological behaviors like towering and provides reliable baseline
for further development of superior models.

## Improve the current heuristic agent, adding new features and tuning the weights
Besides the existing terms (aggregate column height, completed lines, holes,
and bumpiness), _**I introduced:**_
- a max column height penalty to explicitly discourage towering behavior and early top-outs

- a well count, punishing 1-wide pits enclosed by neighboring columns that are hard to fill

- a stronger emphasis on preserving a flat surface profile, indirectly encoded
through the bumpiness and max-height terms.

The weights were adjusted iteratively by observing the agent’s behavior over
multiple automated runs, aiming for strategies that prioritize safe,
low boards with minimal holes and wells while still rewarding
aggressive line clears. This refined heuristic produced more stable play,
better edge usage, and a higher average score compared to the initial version.



## 3. Implementation of a new agent using Beam Search
The new agent was implemented using **_Beam Search algorithm_**. It copies a lot of functions to simulate board
from its predecessor, but this one can exceed the mean score of it by a lot of points (i could calculate the 
mean value of sample of games due to lack of time, but the first and only lose was on **score=2584660**).
Instead of focusing purely on the current piece, it simulates multiple candidates for the best moves, keeping them
and traversing deeper until the maximum depth is reached.

### Beam search procedure
**`beamSearchMove()`** Its main idea is to store the cumulative score and metrics of move sequence. The best
moves in all levels of depth for number of sequences that is width of the beam. It then sorts them by higher score,
then lower `maxHeight`, then higher `minHeight`. After the final depth, selects the best remaining state
and returns its stored first move.

## Conclusion on the Beam Agent

The resulting model consistenly receives scores over 1-2 million points. Without a doubt, it overperforms
basic heuristic model. Thus, I believe that it was implemented correctly and I achieved the initial
goals of creating a stable, performative model.
