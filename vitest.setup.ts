import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// @testing-library/react solo auto-registra su cleanup cuando `afterEach`
// existe como global (Vitest con `globals: true`). Este proyecto no usa
// globals, así que se registra explícitamente para que cada test arranque
// con un DOM limpio.
afterEach(() => {
  cleanup();
});
