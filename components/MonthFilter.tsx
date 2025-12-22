'use client';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

type MonthFilterProps = {
  localMonth: string;
  setLocalMonth: (value: string) => void;
};

export function MonthFilter({ localMonth, setLocalMonth }: MonthFilterProps) {
  const onMonthChange = (value: string) => {
    setLocalMonth(value);
  };

  return (
    <Select value={localMonth} onValueChange={onMonthChange}>
      <SelectTrigger className="flex w-full sm:w-auto">
        <SelectValue placeholder="All Months" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Months</SelectItem>
        {Array.from({ length: 12 }, (_, i) => (
          <SelectItem key={i + 1} value={(i + 1).toString()}>
            {new Date(0, i).toLocaleString('default', { month: 'long' })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
