"""
Question Catalog for Interview Generation.
This file contains categorized questions by skill, mode (MCQ/Normal), and difficulty.
"""

MCQ_QUESTIONS = {
    "javascript": [
        {
            "question": "What is logged by `const items = ['a']; items.push('b'); console.log(items.length);`?",
            "options": [
                "1",
                "A reassignment error",
                "2",
                "undefined"
            ],
            "correct_answer": "2",
            "difficulty": "Fresher"
        },
        {
            "question": "You have an array of users and want a new array containing each user's name, in the same order, without changing the original array. Which method directly expresses this operation?",
            "options": [
                "filter",
                "map",
                "find",
                "sort"
            ],
            "correct_answer": "map",
            "difficulty": "Fresher"
        },
        {
            "question": "Inside an `async` function, an awaited request can reject. Which structure catches that rejection so the function can display an error message?",
            "options": [
                "Call it without `await` inside an otherwise empty `try` block",
                "Put `await request()` inside `try` and handle the error in `catch`",
                "Put only the success-message code in `try`",
                "Check whether the request function itself is `undefined` after calling it"
            ],
            "correct_answer": "Put `await request()` inside `try` and handle the error in `catch`",
            "difficulty": "1-3 Years"
        },
        {
            "question": "A client-side form's submit handler must validate input before deciding whether to send a request. Which event method prevents the browser's default form submission while the handler runs this logic?",
            "options": [
                "stopPropagation()",
                "stopImmediatePropagation()",
                "preventDefault()",
                "dispatchEvent()"
            ],
            "correct_answer": "preventDefault()",
            "difficulty": "1-3 Years"
        }
    ],
    "css": [
        {
            "question": "A card has `width: 200px; padding: 10px; border: 2px solid; box-sizing: border-box`. Ignoring margins, what is its total rendered width?",
            "options": [
                "200px",
                "220px",
                "224px",
                "176px"
            ],
            "correct_answer": "200px",
            "difficulty": "Fresher"
        },
        {
            "question": "A container uses `display: flex; flex-direction: row`. Which declaration centers its children along the main axis?",
            "options": [
                "align-items: center",
                "text-align: center",
                "justify-content: center",
                "align-content: center"
            ],
            "correct_answer": "justify-content: center",
            "difficulty": "Fresher"
        },
        {
            "question": "A layout should use one column below 600px and two columns at 600px or above. Which feature applies CSS rules conditionally based on viewport width?",
            "options": [
                "A hover pseudo-class",
                "A keyframe animation",
                "The z-index property",
                "A media query"
            ],
            "correct_answer": "A media query",
            "difficulty": "1-3 Years"
        }
    ],
    "react": [
        {
            "question": "A list can be reordered and each record has a permanent unique `id`. Which value should be used as each item's React key?",
            "options": [
                "The item's current array index",
                "A random number generated during every render",
                "The same string for every item",
                "The record's permanent unique `id`"
            ],
            "correct_answer": "The record's permanent unique `id`",
            "difficulty": "Fresher"
        },
        {
            "question": "A parent owns a user's display name and a child must display it. Which React mechanism passes that value directly from the parent to the child?",
            "options": [
                "A prop",
                "A key that the child reads as a regular prop",
                "A new independent state value in the child with no synchronization",
                "A CSS custom property"
            ],
            "correct_answer": "A prop",
            "difficulty": "Fresher"
        },
        {
            "question": "In a click handler, you want a counter to increase by two using two separate calls to its setter. Which pair correctly expresses both increments from the previous queued value?",
            "options": [
                "setCount(c => c + 1); setCount(c => c + 1);",
                "setCount(count + 1); setCount(count + 1);",
                "setCount(count); setCount(count + 1);",
                "setCount(() => 1); setCount(() => 1);"
            ],
            "correct_answer": "setCount(c => c + 1); setCount(c => c + 1);",
            "difficulty": "3-5 Years"
        }
    ],
    "python": [
        {
            "question": "A request handler stores each user's items in a function argument declared as `items=[]`. Calls unexpectedly share items. What is the relevant cause?",
            "options": [
                "A new default list is created for each call and then merged",
                "A mutable default object is reused across calls",
                "All local lists automatically become thread-local storage",
                "Appending reassigns the function's default parameter declaration"
            ],
            "correct_answer": "A mutable default object is reused across calls",
            "difficulty": "1-3 Years"
        }
    ],
    "sql": [
        {
            "question": "A transfer subtracts money from one row and adds it to another. Both updates must succeed or neither may persist. Which mechanism groups them?",
            "options": [
                "Sorting",
                "Pagination",
                "An index alone",
                "A database transaction"
            ],
            "correct_answer": "A database transaction",
            "difficulty": "1-3 Years"
        },
        {
            "question": "Which SQL predicate selects rows where `email` is missing as SQL `NULL`?",
            "options": [
                "email IS NULL",
                "email = NULL",
                "email = 'NULL'",
                "email = ''"
            ],
            "correct_answer": "email IS NULL",
            "difficulty": "Fresher"
        }
    ],
    "rest apis": [
        {
            "question": "A mobile app submits an order and times out before seeing the response. Which server-supported approach lets it retry the same logical order without creating duplicates?",
            "options": [
                "Generate a fresh idempotency key for every retry",
                "Retry the POST with exponential backoff but no operation identity",
                "Reuse a server-enforced idempotency key",
                "Extend the timeout without adding deduplication"
            ],
            "correct_answer": "Reuse a server-enforced idempotency key",
            "difficulty": "1-3 Years"
        }
    ],
    "dart": [
        {
            "question": "In an `async` Dart function, how can you obtain a value returned later by a `Future` before the next dependent statement?",
            "options": [
                "Await that future",
                "Cast the future object directly to the result type",
                "Mark the caller `async` but read the result immediately without awaiting it",
                "Start a timer for an assumed network delay and read a shared variable afterward"
            ],
            "correct_answer": "Await that future",
            "difficulty": "Fresher"
        }
    ],
    "swift": [
        {
            "question": "A Swift value is optional and may be `nil`. Which construct conditionally binds its unwrapped value for use in a block?",
            "options": [
                "An unconditional force unwrap",
                "if let",
                "A plain assignment that retains the optional type",
                "String interpolation of the optional"
            ],
            "correct_answer": "if let",
            "difficulty": "Fresher"
        }
    ],
    "kotlin": [
        {
            "question": "For nullable `name: String?`, which expression returns its length, or zero when it is null?",
            "options": [
                "name.length",
                "name!!.length",
                "name?.length ?: 0",
                "name?.length"
            ],
            "correct_answer": "name?.length ?: 0",
            "difficulty": "Fresher"
        }
    ],
    "c": [
        {
            "question": "A buffer has capacity 16 bytes. Before copying an incoming byte sequence without a terminator, what condition prevents writing beyond it?",
            "options": [
                "Length is at least 16",
                "Length is odd",
                "Length is unrelated to capacity",
                "Length is at most 16"
            ],
            "correct_answer": "Length is at most 16",
            "difficulty": "1-3 Years"
        }
    ],
    "ci/cd": [
        {
            "question": "You must prove the artifact deployed to production is the artifact that passed staging. Which approach best preserves that identity?",
            "options": [
                "Rebuild from an unpinned branch separately for production",
                "Copy whichever file has the newest timestamp",
                "Promote the same immutable artifact by verified digest",
                "Trust a mutable `latest` tag alone"
            ],
            "correct_answer": "Promote the same immutable artifact by verified digest",
            "difficulty": "3-5 Years"
        }
    ],
    "architecture design": [
        {
            "question": "A service must continue after one availability zone fails. Which design most directly addresses that failure domain?",
            "options": [
                "Service instances and necessary dependencies spread across zones with tested failover",
                "More instances only in the same zone",
                "Only longer client timeouts",
                "A dashboard with no redundancy"
            ],
            "correct_answer": "Service instances and necessary dependencies spread across zones with tested failover",
            "difficulty": "5+ Years"
        }
    ],
    "monitoring (prometheus/grafana)": [
        {
            "question": "An alert must detect an increased proportion of user-visible request failures. Which measurement directly matches the requirement?",
            "options": [
                "Mean CPU utilization",
                "Total request count alone",
                "Median latency of successful requests only",
                "Failed requests divided by total requests over a defined window"
            ],
            "correct_answer": "Failed requests divided by total requests over a defined window",
            "difficulty": "3-5 Years"
        }
    ],
    "linux": [
        {
            "question": "A filesystem reports no space left and a required service cannot write. What is the best first diagnostic action among these choices?",
            "options": [
                "Increase the service's CPU limit",
                "Inspect filesystem space/inode usage and identify what is consuming the exhausted resource",
                "Increase the service's network timeout",
                "Rotate credentials before inspecting storage"
            ],
            "correct_answer": "Inspect filesystem space/inode usage and identify what is consuming the exhausted resource",
            "difficulty": "1-3 Years"
        }
    ],
    "infrastructure as code": [
        {
            "question": "A resource was changed manually after infrastructure was applied. What comparison detects drift?",
            "options": [
                "Desired declared configuration versus observed resource state",
                "Two identical copies of the configuration repository without reading live state",
                "The current deployment duration versus the previous duration",
                "The module version string alone"
            ],
            "correct_answer": "Desired declared configuration versus observed resource state",
            "difficulty": "3-5 Years"
        }
    ],
    "machine learning": [
        {
            "question": "A scaler's mean and variance are learned before evaluation. Which data should fit it in a standard train/held-out evaluation?",
            "options": [
                "The held-out set only",
                "All data including held-out examples",
                "The training set only",
                "The final prediction outputs"
            ],
            "correct_answer": "The training set only",
            "difficulty": "1-3 Years"
        }
    ],
    "statistics": [
        {
            "question": "A team wants to estimate the causal effect of a product change. Which design most directly reduces systematic assignment differences when feasible?",
            "options": [
                "Let users choose their group",
                "Assign this month's users to treatment and last month's users to control",
                "Assign the most active users to treatment and the least active to control",
                "Randomly assign eligible users to treatment and control"
            ],
            "correct_answer": "Randomly assign eligible users to treatment and control",
            "difficulty": "1-3 Years"
        }
    ],
    "etl": [
        {
            "question": "A daily load can be retried after partial failure. Which destination behavior helps avoid duplicate logical records?",
            "options": [
                "Append every row on every retry with a new destination ID",
                "Upsert using a stable source-record key and defined update semantics",
                "Use retry execution time as the only uniqueness key",
                "Deduplicate only within each batch and append it to the existing destination"
            ],
            "correct_answer": "Upsert using a stable source-record key and defined update semantics",
            "difficulty": "3-5 Years"
        }
    ],
    "nlp": [
        {
            "question": "Near-identical versions of the same document occur in training and test data. What evaluation problem does this create most directly?",
            "options": [
                "A mismatch in model parameter count",
                "A requirement to use identical class counts in each split",
                "A guarantee that inference latency is underestimated",
                "Potentially inflated evaluation from content overlap across the split"
            ],
            "correct_answer": "Potentially inflated evaluation from content overlap across the split",
            "difficulty": "3-5 Years"
        }
    ],
    "computer vision": [
        {
            "question": "Adjacent frames from the same video are randomly split across training and testing. What is a major evaluation risk?",
            "options": [
                "The split necessarily creates a different image resolution in testing",
                "Random assignment guarantees independence even for adjacent frames",
                "Highly similar frames can leak scene information across the split",
                "Scene overlap makes all test labels invalid regardless of labeling quality"
            ],
            "correct_answer": "Highly similar frames can leak scene information across the split",
            "difficulty": "3-5 Years"
        }
    ]
}

NORMAL_QUESTIONS = {
    "javascript": [
        {
            "question": "Given `['React', 'CSS', 'React']`, produce an array containing each skill once while preserving first occurrence order. Explain your approach and test it with an empty array.",
            "rubric": "Look for a set or explicit membership tracking, result `['React', 'CSS']`, input preservation, and an empty-array result.",
            "difficulty": "Fresher"
        },
        {
            "question": "A function intended to return names uses `users.forEach(user => user.name)` and returns `undefined`. Explain why and rewrite it to return an array of names.",
            "rubric": "Look for the difference between iteration and transformation, `map` or a correctly accumulated array, and a simple input/output example.",
            "difficulty": "Fresher"
        },
        {
            "question": "Describe how a page should behave while a list request is loading, when it succeeds with no results, and when it fails. Write pseudocode for the request and these states.",
            "rubric": "Look for separate loading/empty/error/success states, awaited request handling, cleanup of loading state, and a usable retry path.",
            "difficulty": "1-3 Years"
        },
        {
            "question": "Write pseudocode for a submit handler that rejects a name containing only spaces, displays a useful message, and sends a request only when validation passes. Explain how you would test it.",
            "rubric": "Look for trimming before validation, preventing unwanted default submission, a clear validation branch, and blank/whitespace/valid-name cases.",
            "difficulty": "1-3 Years"
        }
    ],
    "css": [
        {
            "question": "A card has `width: 100%`, horizontal padding, and a border. It overflows its parent. Explain how the default box model can cause this and show one CSS change to fix it.",
            "rubric": "Look for content-box width plus padding/borders, `box-sizing: border-box` or an equivalent justified sizing fix, and checking the result at a narrow viewport.",
            "difficulty": "Fresher"
        },
        {
            "question": "Create a product-card layout that uses one column on small screens and two equal columns when the viewport is at least 600px wide. Describe the CSS and how you would verify the breakpoint.",
            "rubric": "Look for Grid or Flexbox, explicit width condition, spacing without overflow, and checks below/at/above 600px.",
            "difficulty": "Fresher"
        },
        {
            "question": "A long unbroken word causes a card to exceed the width of a phone screen. Explain how you would inspect the problem and suggest a CSS fix without hiding the text.",
            "rubric": "Look for identifying the overflowing element, a wrapping rule such as `overflow-wrap: anywhere`, checking width/minimum-size constraints when relevant, and verification with both short and long text.",
            "difficulty": "1-3 Years"
        }
    ],
    "react": [
        {
            "question": "Design a small React component with a text input and a filtered list of names. Explain where the input value lives and how the displayed list updates as the user types.",
            "rubric": "Look for state, `value`/`onChange`, deriving filtered results, stable keys, and sensible behavior when no name matches.",
            "difficulty": "Fresher"
        },
        {
            "question": "Two sibling components must show the same selected color, and either can change it. Explain where you would put the state and how updates reach both components.",
            "rubric": "Look for common-parent state, values passed through props, change callbacks, and one source of truth.",
            "difficulty": "1-3 Years"
        },
        {
            "question": "A counter starts at zero. Its click handler calls `setCount(count + 1)` twice, but the next rendered count is one. Explain this behavior and change the handler so one click adds two.",
            "rubric": "Look for functional updates or a single `+ 2` update, and a second-click check.",
            "difficulty": "3-5 Years"
        }
    ],
    "python": [
        {
            "question": "Rewrite a function using a mutable default list so calls do not unintentionally share data. How would you test two independent calls?",
            "rubric": "Look for `None` sentinel or equivalent per-call construction, preservation of explicitly supplied arguments, isolation test.",
            "difficulty": "1-3 Years"
        }
    ],
    "sql": [
        {
            "question": "Describe a transfer endpoint whose debit succeeds but whose credit fails. Explain transaction boundaries, rollback, and a failure test.",
            "rubric": "Look for atomic updates, error handling, balances unchanged after rollback.",
            "difficulty": "1-3 Years"
        },
        {
            "question": "Count customers with missing email values and explain how you would handle empty strings separately.",
            "rubric": "Look for null semantics, clear counting rule, treatment of whitespace if relevant.",
            "difficulty": "Fresher"
        }
    ],
    "rest apis": [
        {
            "question": "Design the user-visible behavior when an order submission times out on a mobile network.",
            "rubric": "Look for uncertain outcome, stable operation identity, status/retry path, avoiding a false success or duplicate order.",
            "difficulty": "1-3 Years"
        }
    ],
    "dart": [
        {
            "question": "Sketch a Flutter screen that loads a list and displays loading, success, and failure states.",
            "rubric": "Look for asynchronous result handling, explicit states, error/retry behavior, and no assumption that the request completes immediately.",
            "difficulty": "Fresher"
        }
    ],
    "swift": [
        {
            "question": "A profile response may omit the display name. Show how you would handle that optional value and choose a fallback label.",
            "rubric": "Look for safe optional handling, deliberate fallback, present/missing cases.",
            "difficulty": "Fresher"
        }
    ],
    "kotlin": [
        {
            "question": "Handle a nullable user name in a profile screen without crashing. Include behavior for null and an empty string.",
            "rubric": "Look for null safety, distinction between null/empty, clear display behavior.",
            "difficulty": "Fresher"
        }
    ],
    "c": [
        {
            "question": "Design bounds checks for an incoming message copied into a fixed-size buffer. Distinguish raw bytes from a null-terminated string.",
            "rubric": "Look for capacity accounting, rejection/truncation policy, boundary tests, terminator space when applicable.",
            "difficulty": "1-3 Years"
        }
    ],
    "ci/cd": [
        {
            "question": "Design artifact promotion from staging to production with traceability and rollback.",
            "rubric": "Look for immutable identity, validation gates, approvals appropriate to the workflow, rollback artifact availability.",
            "difficulty": "3-5 Years"
        }
    ],
    "architecture design": [
        {
            "question": "Outline a multi-zone design and a test for loss of one zone. State dependency, data-consistency, capacity, and recovery assumptions.",
            "rubric": "Look for failure domains, remaining capacity, data-layer behavior, measurable recovery goals.",
            "difficulty": "5+ Years"
        }
    ],
    "monitoring (prometheus/grafana)": [
        {
            "question": "Propose an alert for rising API failures, including the measurement window, low-traffic behavior, and investigation steps.",
            "rubric": "Look for numerator/denominator, actionable threshold, traffic context, evidence rather than alert volume alone.",
            "difficulty": "3-5 Years"
        }
    ],
    "linux": [
        {
            "question": "Investigate a Linux server reporting no space left on device. Explain how you would distinguish space and inode exhaustion and choose a controlled cleanup.",
            "rubric": "Look for measurement, file ownership/use, retention, service verification.",
            "difficulty": "1-3 Years"
        }
    ],
    "infrastructure as code": [
        {
            "question": "Describe a drift-detection and remediation workflow for shared infrastructure.",
            "rubric": "Look for state comparison, impact review, deliberate reconciliation, avoiding blind overwrite of critical changes.",
            "difficulty": "3-5 Years"
        }
    ],
    "machine learning": [
        {
            "question": "Design a preprocessing/training/evaluation pipeline that avoids leakage.",
            "rubric": "Look for split discipline, train-only fitting, consistent transform at inference, cross-validation boundaries when used.",
            "difficulty": "1-3 Years"
        }
    ],
    "statistics": [
        {
            "question": "Plan an experiment for a product change. Define a primary metric, randomization unit, and checks before interpreting results.",
            "rubric": "Look for assignment, metric definition, sample/uncertainty considerations, contamination and data quality.",
            "difficulty": "1-3 Years"
        }
    ],
    "etl": [
        {
            "question": "Design a retryable daily ingestion job with late updates.",
            "rubric": "Look for source keys, checkpoints, deduplication/upserts, late-arrival policy, reconciliation and partial-failure tests.",
            "difficulty": "3-5 Years"
        }
    ],
    "nlp": [
        {
            "question": "Design a split and evaluation procedure for document classification when duplicates and revised documents exist.",
            "rubric": "Look for grouping/deduplication, label balance, deployment-relevant time split when appropriate, error analysis.",
            "difficulty": "3-5 Years"
        }
    ],
    "computer vision": [
        {
            "question": "Plan evaluation for a classifier trained on video frames and deployed on new camera recordings.",
            "rubric": "Look for video/session grouping, camera/domain coverage, representative held-out conditions, class-specific errors.",
            "difficulty": "3-5 Years"
        }
    ]
}

def get_mcq_questions(skill: str):
    return MCQ_QUESTIONS.get(skill.lower(), [])

def get_normal_questions(skill: str):
    return NORMAL_QUESTIONS.get(skill.lower(), [])
