"use client";

import { ArrowLeft, Clock, Eye, EyeOff, ShieldCheck, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const { isLoading, errorMessage, successMessage, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const redirectParam = searchParams.get("redirect");

    const result = await login(
      { email: formData.email, password: formData.password },
      redirectParam,
    );

    if (result.success && result.redirectPath) {
      setTimeout(() => {
        router.replace(result.redirectPath!);
      }, 500);
    }
  };

  return (
    <div className="flex min-h-screen bg-white" suppressHydrationWarning>
      <aside className="fixed inset-y-0 hidden w-[520px] flex-col bg-[#081c33] px-14 py-10 text-white lg:flex">
        <Link
          className="inline-flex items-center gap-2 text-white/50 transition-colors hover:text-white"
          href="/"
        >
          <ArrowLeft size={16} />
          <span className="text-sm">Back to Home</span>
        </Link>
        <div className="my-auto ">
          <div className="pb-2 ">
            <Image
              alt="AKRA LOGO"
              height={52}
              src="/AKRA_JPEG_LOGO_250-250.jpg"
              style={{ height: "auto", backgroundColor: "white" }}
              width={110}
            />
          </div>
          <h1 className="mt-6 font-semibold text-3xl leading-tight tracking-tight">
            Welcome back
          </h1>
          <p className="mt-3 max-w-xs text-sm text-white/60 leading-relaxed">
            Sign in to your AKRA IMS account and continue your Wealth Journey.
          </p>
          <ul className="mt-14 space-y-4">
            {[
              {
                Icon: ShieldCheck,
                title: "Secure Access",
                description: "Bank-level security to protect your account",
              },
              {
                Icon: Zap,
                title: "Quick & Easy",
                description: "Simple sign-in process to get you started",
              },
              {
                Icon: Clock,
                title: "24/7 Access",
                description: "Manage your philanthropic activities anytime",
              },
            ].map((benefit) => (
              <li
                className="flex items-start gap-4 border-white/10 border-l-2 py-3.5 pl-6"
                key={benefit.title}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                  <benefit.Icon size={16} />
                </div>
                <div>
                  <h3 className="font-medium text-sm text-white">
                    {benefit.title}
                  </h3>
                  <p className="mt-1 text-sm text-white/50">
                    {benefit.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-white/10 border-t pt-6 text-sm">
          <span className="text-white/50">Need assistance? </span>
          <a
            className="font-medium text-white underline underline-offset-4 hover:text-white/70"
            href="mailto:acgfund@akrais.com"
          >
            Contact Support
          </a>
        </div>
      </aside>

      <main className="flex min-h-screen flex-1 items-center bg-white px-4 py-6 lg:ml-[520px] sm:px-8 lg:px-12 lg:py-8">
        <div className="w-full lg:mx-auto lg:max-w-2xl">
          <Link
            className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 lg:hidden"
            href="/"
          >
            <ArrowLeft size={18} /> Back to Home
          </Link>
          <div className="flex flex-wrap items-center gap-4 ">
            {/* <Image
              alt="AKRA LOGO"
              height={32}
              src="/AKRA_WHITE BG PNG.png"
              style={{ height: "auto" }}
              width={90}
            /> */}
            {/* <div className="hidden h-9 w-px bg-gray-200 sm:block" /> */}
            <div>
              <h2 className="font-semibold text-gray-900 text-xl">Sign In</h2>
              <p className="text-gray-500 text-sm">
                Welcome to your AKRA IMS account.
              </p>
            </div>
          </div>

          <form
            className="fade-in slide-in-from-bottom-2 mt-6 animate-in space-y-5 duration-300 motion-reduce:animate-none"
            onSubmit={handleSubmit}
          >
            <section className="rounded-md border border-gray-200 bg-white px-6 py-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    className="font-medium text-gray-700 text-sm"
                    htmlFor="email"
                  >
                    Email Address
                    <span className="ml-0.5 text-[#90191b]">*</span>
                  </Label>
                  <Input
                    className="h-10 bg-white"
                    id="email"
                    name="email"
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    required
                    type="email"
                    value={formData.email}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    className="font-medium text-gray-700 text-sm"
                    htmlFor="password"
                  >
                    Password<span className="ml-0.5 text-[#90191b]">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      className="h-10 bg-white pr-10"
                      id="password"
                      name="password"
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      required
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                    />
                    <button
                      className="-translate-y-1/2 absolute top-1/2 right-3 transform cursor-pointer text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      checked={formData.rememberMe}
                      className="text-[#90191b] focus:ring-[#90191b]"
                      name="rememberMe"
                      onChange={handleInputChange}
                      type="checkbox"
                    />
                    <span className="text-gray-700 text-sm">Remember me</span>
                  </label>
                  <Link
                    className="text-[#90191b] text-sm hover:underline"
                    href="/forgot-password"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
            </section>

            {errorMessage && (
              <div className="fade-in slide-in-from-top-1 animate-in rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-center text-red-600 text-sm duration-200 motion-reduce:animate-none">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="fade-in slide-in-from-top-1 animate-in rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-center text-green-600 text-sm duration-200 motion-reduce:animate-none">
                {successMessage}
              </div>
            )}

            <div className="flex items-center justify-between border-gray-200 border-t pt-5">
              <p className="hidden text-gray-400 text-xs sm:block">
                Fields marked with <span className="text-[#90191b]">*</span> are
                required.
              </p>
              <Button
                className="h-10 w-full cursor-pointer rounded-md bg-[#90191b] px-8 font-medium text-white hover:bg-[#7a1517] disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto"
                isDisabled={!(formData.email && formData.password) || isLoading}
                type="submit"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
            <p className="text-gray-400 text-xs sm:hidden">
              Fields marked with <span className="text-[#90191b]">*</span> are
              required.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
