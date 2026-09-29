# Native restart-check investigation

The first alpha.3 run (36618421926) passed the browser gate but did not produce an approved APK. Its retained artifact 11057477094 (SHA256 9e6a302f0fefaa5392fef3bd091590d24ddeb3456a8397846a5defa5a8ee002e) records baseline rotation, baseline resume and storyJourney as passed, followed by a null result from the storyResumeAfterProcessStop comparison. A preceding raw job-log response differed; the retained individual test files narrowed this investigation. No proven rotation or gameplay-save defect was inferred from the differing response.

The previous comparison kept its expected snapshot in a second localStorage key immediately before force-stop. A null evaluation did not establish which snapshot was absent. Commit 4c1fd8e moved the expected reference outside application storage into a synced test-only evidence file, explicitly asserted that the actual journey exists, and retained identical story/cash/mileage comparisons. A failure watcher and bounded shell diagnostics captured screenshots and actual save data without hiding failure status.

## Second run: actual values survived, test serialization was wrong

Run 36620544620 again passed the browser gate. Native artifact 11058831063 (SHA256 54678a7c5c333c655f336ec293eeea3fb15aac61461460d68dbbf32a24295d94) passed baseline rotation/resume and storyJourney. The new strict restart comparison returned false.

The retained expected snapshot and actual complete journey were compared independently: ALL values were identical, including story, cash 978, mileage 52 and the run ID. However, evaluateJavascript serializing JSON.parse(save) reordered object keys in the expected reference. JSON.stringify(expected.story) therefore differed from JSON.stringify(actual.story) solely because of key order. The failure screen was still the title screen; the launch helper also waited only for an HTML element, not for scripts/handlers to finish loading.

## Second bounded harness correction

Preserve the original localStorage text via evaluateJavascript(getItem(...)) and decode its JSON string with JSONTokener, rather than asking Android to serialize a parsed object. Keep the exact existing story/cash/mileage equality checks. Require document.readyState complete and installed game handlers before test clicks; additionally require the road screen to become active after Resume. No expected snapshot is ever written back into the game save. No game code, comparison tolerance, disabled test or accepted failure is introduced.

The existing hash-checked materializer applies only this instrumentation-source file, checks its before/after blob hashes, and commits ordinary source on the expansion branch before verification. The diagnostic watcher and bounded failure-evidence pull remain enabled. Native verification must rerun. If this second harness correction fails, stop and escalate with evidence rather than weakening the assertion or blindly rerunning.
