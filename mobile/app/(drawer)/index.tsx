import { HomePage } from "@/features/homepage/HomePage";
import { useState } from "react";

export default function Index() {
  const [displayDate] = useState(new Date(Date.now()));
  return <HomePage displayDate={displayDate} />;
}
