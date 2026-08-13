import { describe, expect, it } from "vitest";
import { ArchitectureReview } from "@coding-cad/architecture-review";
import { pointsSystemFixture } from "../projection/points-system-fixture.js";
import { CommandApplication } from "./command-application.js";

describe("command validation gate", () => {
  it("rejects an invalid candidate even when approval was requested", async () => {
    const acceptedBefore = structuredClone(pointsSystemFixture);
    const application = new CommandApplication({
      review: new ArchitectureReview({
        clock: () => new Date("2026-08-13T00:00:00.000Z"),
        idGenerator: (() => { let id = 0; return () => `gate-${++id}`; })()
      })
    });

    const result = await application.execute(pointsSystemFixture, {
      type: "connect-components",
      connection: { id: "dangling", from: "ledger", to: "missing", protocol: "REST" }
    }, "approve");

    expect(result.validation.valid).toBe(false);
    expect(result.status).toBe("rejected");
    expect(result.proposal.status).toBe("rejected");
    expect(result.accepted).toBe(pointsSystemFixture);
    expect(result.accepted).toEqual(acceptedBefore);
  });
});
