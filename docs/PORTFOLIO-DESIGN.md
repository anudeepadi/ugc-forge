# Portfolio design: brief → script → review

Phase two refines the existing React campaign planning workspace. The goal is to make script review the clearest useful output. The browser demo and the optional FastAPI backend must stay distinct.

## Problems found

- The demo gave each script a random `viral_score` (70–99), while **Scores** showed a fixed 9.1–7.3 list. The average on **Command** therefore disagreed with **Scores**, and it changed on every reload.
- **Scores** ranked the variants on a "leaderboard" with star icons. This made fictional values look like a merit ranking.
- With a backend, every click on **Load sample campaign** created another campaign, and a double-click could create two.
- In **Scripts**, a reviewer could not check a draft against the brief's claims without leaving the page.
- On phones, the fixed 240px sidebar and `ml-60` left about 130px for content.
- Form fields used `focus:outline-none`, which hid the global focus-visible outline.
- Failed campaign creation and sample loading were silent.

## Options

### A. Review drawer with approve/reject state

Add a side drawer for each script with approve, reject, and notes, then persist the state.

- Pro: the most complete review workflow.
- Con: it needs new backend fields, a new endpoint, and a new demo state model. That is a new feature, not a refinement.

### B. Merge Scores into Scripts

Remove the **Scores** route and show the sample score inline on each script card.

- Pro: one fewer screen.
- Con: putting a score on the main review artifact gives it *more* prominence. It also removes a route that the README and the backend CSV refer to.

### C. Focused refinements in place (chosen)

- Expand **Review** to show the complete hook, body, and CTA, together with the brief's audience and claims to check against.
- Give scores one source. The demo uses the same fixed sample values as the backend stub provider (`SAMPLE_SCORES` in `src/lib/mock-data.ts`, which mirrors `_SCORES` in `backend/app/providers/script/stub.py`). **Scores** reads `viral_score` from each script and computes its average from those same rows.
- Remove the score stat from **Command**, and remove the leaderboard and star icons from **Scores**. Show scores as a plain list in script order, labelled illustrative.
- Make **Load sample campaign** reopen an existing sample campaign by product name in either mode. Guard it against concurrent clicks.
- Add explanatory error messages that state the next action, the phone layout fix, and visible keyboard focus on form fields.

This is the smallest change that fixes each problem without adding backend surface or restyling the product.

## Boundaries kept

- Scores are illustrative sample values, not performance predictions, in both modes.
- **Exports** stays disabled in the browser demo. With a backend, CSV only. ZIP and JSON remain marked as not implemented.
- The optional backend APIs, the network fallback to demo data, and the "Sample" and "Draft" labels are unchanged.
- No paid providers are added. No video, files, or customer outcomes are implied.
