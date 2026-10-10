import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

test("el entorno jsdom + Testing Library renderiza componentes", () => {
  render(<h1>APSys</h1>);

  expect(
    screen.getByRole("heading", { level: 1, name: "APSys" }),
  ).toBeInTheDocument();
});
