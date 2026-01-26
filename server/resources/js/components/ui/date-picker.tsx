import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDownIcon } from "lucide-react"
import { DateTime } from "luxon"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

interface DatePickerProps {
    value?: Date;
    onChange?: (date?: Date) => void;
    placeholder?: string;
    minDate?: Date;
    maxDate?: Date;
}

export function DatePicker({ value, onChange, placeholder, maxDate, minDate }: DatePickerProps) {
    const { i18n } = useTranslation();

    const dateValue = useMemo(() => {
        if (!value) return undefined;
        return typeof value === "string" ? new Date(value) : value;
    }, [value]);

    const handleSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            const normalizedDate = new Date(selectedDate);
            normalizedDate.setHours(0, 0, 0, 0);

            if (onChange) {
                onChange(normalizedDate);
            }
        } else {
            if (onChange) onChange(undefined);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    data-empty={!value}
                    className="data-[empty=true]:text-muted-foreground w-full justify-between text-left font-normal">
                    {dateValue && !isNaN(dateValue.getTime()) ? (
                        DateTime.fromJSDate(dateValue)
                            .setLocale(i18n.language)
                            .toLocaleString(DateTime.DATE_FULL)
                    ) : (
                        <span>{placeholder || ''}</span>
                    )}
                    <ChevronDownIcon className="h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={dateValue}
                    onSelect={handleSelect}
                    defaultMonth={value}
                    disabled={(date) => {
                        const d = new Date(date);
                        d.setHours(0, 0, 0, 0);

                        // Check for future (maxDate)
                        if (maxDate instanceof Date && !isNaN(maxDate.getTime())) {
                            const max = new Date(maxDate);
                            max.setHours(0, 0, 0, 0);
                            if (d > max) return true;
                        }

                        // Check for the past (minDate)
                        if (minDate instanceof Date && !isNaN(minDate.getTime())) {
                            const min = new Date(minDate);
                            min.setHours(0, 0, 0, 0);
                            if (d < min) return true;
                        }

                        return false;
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}