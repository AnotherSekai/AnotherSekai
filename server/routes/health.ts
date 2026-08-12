import { json } from "../utils/http";

export const handleHealth = () => json({ ok: true });
