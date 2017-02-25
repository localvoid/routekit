import { Routes } from "./routes";

export interface Emitter {
    emit(routes: Routes): string;
}
