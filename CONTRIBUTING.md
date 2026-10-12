# How we work

- **Branches.** Never commit to `main`. Work on a feature branch, open a PR into `dev`;
  `dev` goes to `main` in a release PR. Feature → dev is squash-merged with the branch
  deleted; dev → main is a merge commit and `dev` is never deleted.
- **Every PR fills the template:** Why (quote the ask) / What changed / How it was tested /
  Review notes. Claude reviews every PR before merge and posts it as "Review by Claude".
- **Tests ship with the change.** New behaviour gets a test; a bug fix gets the test that
  would have caught it. Run `node --test` before opening a PR and say the result in it.
  Watch a new test fail once before trusting it.
- **Facts live in `data/identity.json`.** Never type her phone, license or team name into
  copy or markup; use the placeholders and the identity record.
- **Her words are hers.** Copy about Margarita is reviewed by her before it ships; flag
  wording changes, do not paraphrase what she approved.
- **Works anywhere.** No hardcoded home paths, no secrets in the tree, no browser storage
  as a system of record, no dependencies that need a package manager.
