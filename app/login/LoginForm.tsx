"use client";

import { useActionState } from "react";

import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        E-mail
        <input
          autoComplete="email"
          className="h-11 rounded-md border border-slate-300 px-3"
          name="email"
          type="email"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Senha
        <input
          autoComplete="current-password"
          className="h-11 rounded-md border border-slate-300 px-3"
          name="password"
          type="password"
        />
      </label>
      {state.message ? <p className="text-sm font-medium text-red-700">{state.message}</p> : null}
      <button
        className="h-11 rounded-md bg-emerald-700 font-semibold text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        Entrar
      </button>
    </form>
  );
}
