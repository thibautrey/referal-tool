import { Image } from "@/components/shared/Image";

export function Logo() {
  return (
    <div className="flex items-center">
      <Image src="/images/logo.avif" alt="Logo" className="h-8 w-auto" />
      <span className="ml-2 text-lg font-bold">rflnk</span>
    </div>
  );
}
