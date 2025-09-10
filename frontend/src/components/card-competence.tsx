"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "./ui/button";

interface ICardCompotenceProps {
  title: string;
  count: number | string;
  onClick?: () => void;
  disabled?: boolean;
}

export default function CardCompetence({
  title,
  count,
  onClick,
  disabled = false,
}: ICardCompotenceProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <h2 className="scroll-m-20 border-b pb-2 text-xl text-center font-medium tracking-tight first:mt-0">
          {count}
        </h2>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onClick} disabled={disabled}>
          Select
        </Button>
      </CardFooter>
    </Card>
  );
}
