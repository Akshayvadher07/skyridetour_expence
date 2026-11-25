"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { TripForm } from "@/components/trips/TripForm";

export default function NewTripPage() {
  const router = useRouter();
  const isNavigating = useRef(false);

  const returnToTrips = useCallback(() => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    router.replace("/trips");
  }, [router]);

  return (
    <TripForm
      open
      onClose={returnToTrips}
      onSuccess={returnToTrips}
    />
  );
}
