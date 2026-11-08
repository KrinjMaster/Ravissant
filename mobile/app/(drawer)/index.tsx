import { HomePage } from "@/features/homepage/HomePage";
import { useState } from "react";

export default function Index() {
  const [displayDate, setDisplayDate] = useState(() => new Date());

  const changeDate = (days: number) => {
    setDisplayDate((currentDate) => {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + days);
      return nextDate;
    });
  };

  return <HomePage displayDate={displayDate} onChangeDate={changeDate} />;
}
