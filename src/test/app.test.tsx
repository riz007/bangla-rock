import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createAgent } from "@ui-sdk/react/agent";
import { expect, test } from "vitest";
import App from "../App";
import { ALBUMS, ERAS } from "../data/albums";

const agent = createAgent();
const sleeves = () => document.querySelectorAll(".sleeve").length;
const named = () =>
  agent.snapshot().filter((e) => !e.offPage && e.component !== "more");

test("an agent can search, filter and set the room", async () => {
  render(<App />);
  for (const e of named())
    expect(e.label, `${e.component} ${e.ref} has no name`).toBeTruthy();
  const labels = named().map((e) => e.label);
  for (const label of ["Search albums, bands or years", "Era", "Genre"])
    expect(labels).toContain(label);

  const era = ERAS[ERAS.length - 1];
  const item = named()
    .find((e) => e.label === "Era")!
    .items!.find((i) => i.value === era.id)!;
  let r = await agent.act({
    steps: [{ ref: "Era", action: "setValue", args: [item.label] }],
  });
  expect(r.ok, r.error?.message).toBe(true);
  expect(sleeves()).toBe(
    ALBUMS.filter((a) => a.year >= era.from && a.year <= era.to).length,
  );

  r = await agent.act({
    steps: [
      { ref: "Era", action: "setValue", args: ["All years 88"] },
      { ref: "Folk, Fusion & Indie", action: "setPressed", args: [true] },
    ],
  });
  expect(r.ok, r.error?.message).toBe(true);
  expect(sleeves()).toBe(ALBUMS.filter((a) => a.genre === "folk").length);

  r = await agent.act({
    steps: [
      { ref: "Folk, Fusion & Indie", action: "setPressed", args: [false] },
      {
        ref: "Search albums, bands or years",
        action: "setValue",
        args: ["Warfaze"],
      },
    ],
  });
  expect(r.ok, r.error?.message).toBe(true);
  expect(sleeves()).toBeGreaterThan(0);
  expect(sleeves()).toBeLessThan(ALBUMS.length);

  r = await agent.act({
    steps: [{ ref: "Theme", action: "setPressed", args: [true] }],
  });
  expect(r.ok, r.error?.message).toBe(true);
  await act(async () => {});
  const room = named().find((e) => e.label === "Room")!;
  const xerox = room.items!.find((i) => i.value === "xerox")!;
  r = await agent.act({
    steps: [
      { ref: "Room", action: "setValue", args: [xerox.label] },
      { ref: "Compact crate", action: "toggle" },
    ],
  });
  expect(r.ok, r.error?.message).toBe(true);
  expect(document.documentElement.dataset.theme).toBe("xerox");
  expect(document.querySelector(".crate")!.classList.contains("dense")).toBe(
    true,
  );
});

test("every room switch turns with Space", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: /Theme/ }));
  const switches = screen.getAllByRole("switch");
  expect(switches).toHaveLength(5);
  for (const s of switches) {
    const before = s.getAttribute("aria-checked");
    s.focus();
    await user.keyboard(" ");
    expect(s.getAttribute("aria-checked"), s.textContent ?? "").not.toBe(
      before,
    );
  }
});
