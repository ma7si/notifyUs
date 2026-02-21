import { userMatchesSegment, filterNotificationsForUser } from "@/lib/segment-matcher";

describe("userMatchesSegment", () => {
  const makeSegment = (rules: { field: string; operator: string; value: unknown }[]) => ({
    id: "seg-1",
    rules,
  });

  test("matches when no rules", () => {
    expect(
      userMatchesSegment({ id: "user-1" }, makeSegment([]))
    ).toBe(true);
  });

  test("matches plan in list", () => {
    const segment = makeSegment([
      { field: "plan", operator: "in", value: ["pro", "enterprise"] },
    ]);
    expect(
      userMatchesSegment({ id: "user-1", plan: "pro" }, segment)
    ).toBe(true);
    expect(
      userMatchesSegment({ id: "user-2", plan: "starter" }, segment)
    ).toBe(false);
  });

  test("matches role equals", () => {
    const segment = makeSegment([
      { field: "role", operator: "eq", value: ["admin"] },
    ]);
    expect(
      userMatchesSegment({ id: "u", role: "admin" }, segment)
    ).toBe(true);
    expect(
      userMatchesSegment({ id: "u", role: "member" }, segment)
    ).toBe(false);
  });

  test("matches not_in operator", () => {
    const segment = makeSegment([
      { field: "plan", operator: "not_in", value: ["free"] },
    ]);
    expect(
      userMatchesSegment({ id: "u", plan: "pro" }, segment)
    ).toBe(true);
    expect(
      userMatchesSegment({ id: "u", plan: "free" }, segment)
    ).toBe(false);
  });

  test("matches tags array with in", () => {
    const segment = makeSegment([
      { field: "tags", operator: "in", value: ["trial"] },
    ]);
    expect(
      userMatchesSegment({ id: "u", tags: ["trial", "onboarding"] }, segment)
    ).toBe(true);
    expect(
      userMatchesSegment({ id: "u", tags: ["power-user"] }, segment)
    ).toBe(false);
  });

  test("multiple rules: all must match (AND logic)", () => {
    const segment = makeSegment([
      { field: "plan", operator: "in", value: ["pro"] },
      { field: "role", operator: "eq", value: ["admin"] },
    ]);
    expect(
      userMatchesSegment({ id: "u", plan: "pro", role: "admin" }, segment)
    ).toBe(true);
    expect(
      userMatchesSegment({ id: "u", plan: "pro", role: "member" }, segment)
    ).toBe(false);
    expect(
      userMatchesSegment({ id: "u", plan: "starter", role: "admin" }, segment)
    ).toBe(false);
  });

  test("contains operator", () => {
    const segment = makeSegment([
      { field: "email", operator: "contains", value: ["@acme.com"] },
    ]);
    expect(
      userMatchesSegment({ id: "u", email: "user@acme.com" }, segment)
    ).toBe(true);
    expect(
      userMatchesSegment({ id: "u", email: "user@other.com" }, segment)
    ).toBe(false);
  });
});

describe("filterNotificationsForUser", () => {
  const makeNotification = (
    id: string,
    segments: { segment: { id: string; rules: { field: string; operator: string; value: unknown }[] } }[],
    exclusions: { segment: { id: string; rules: { field: string; operator: string; value: unknown }[] } }[] = []
  ) => ({ id, segments, exclusions });

  test("no segments: shown to all users", () => {
    const notifications = [makeNotification("n-1", [], [])];
    const result = filterNotificationsForUser(notifications, { id: "u-1" });
    expect(result).toContain("n-1");
  });

  test("with segment: shown to matching user", () => {
    const notifications = [
      makeNotification("n-1", [
        {
          segment: {
            id: "s-1",
            rules: [{ field: "plan", operator: "in", value: ["pro"] }],
          },
        },
      ]),
    ];
    const matching = filterNotificationsForUser(notifications, {
      id: "u-1",
      plan: "pro",
    });
    const notMatching = filterNotificationsForUser(notifications, {
      id: "u-2",
      plan: "free",
    });
    expect(matching).toContain("n-1");
    expect(notMatching).not.toContain("n-1");
  });

  test("exclusion: not shown to excluded user", () => {
    const notifications = [
      makeNotification(
        "n-1",
        [
          {
            segment: {
              id: "s-1",
              rules: [{ field: "plan", operator: "in", value: ["pro"] }],
            },
          },
        ],
        [
          {
            segment: {
              id: "s-2",
              rules: [{ field: "role", operator: "eq", value: ["admin"] }],
            },
          },
        ]
      ),
    ];
    // Pro + not admin: should see
    const included = filterNotificationsForUser(notifications, {
      id: "u-1",
      plan: "pro",
      role: "member",
    });
    // Pro + admin: excluded
    const excluded = filterNotificationsForUser(notifications, {
      id: "u-2",
      plan: "pro",
      role: "admin",
    });
    expect(included).toContain("n-1");
    expect(excluded).not.toContain("n-1");
  });
});
