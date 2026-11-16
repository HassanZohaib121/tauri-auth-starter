import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="h-screen w-full flex flex-col justify-center items-center bg-background text-foreground">
      <h1 className="text-9xl font-extrabold tracking-widest text-foreground/80">
        404
      </h1>
      <div className="bg-primary text-primary-foreground px-2 text-sm font-medium rounded rotate-12 absolute shadow-sm">
        Page Not Found
      </div>
      <Button className="mt-6" variant="outline">
        <Link href="/dashboard">Go Home</Link>
      </Button>
    </main>
  );
}
