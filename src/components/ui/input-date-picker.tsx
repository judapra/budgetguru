// src/components/ui/input-date-picker.tsx
"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { ControllerRenderProps } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

// Definimos as props que nosso componente vai receber
interface InputDatePickerProps {
  field: ControllerRenderProps<any, any>; // O objeto 'field' do react-hook-form
}

export function InputDatePicker({ field }: InputDatePickerProps) {
  // Estado para controlar a abertura do Popover
  const [isOpen, setIsOpen] = React.useState(false);
  
  // O nosso "Estado de Exibição" para o valor do texto no input
  const [inputValue, setInputValue] = React.useState<string>(
    field.value ? format(field.value, "dd/MM/yyyy") : ""
  );

  // Efeito para sincronizar o input quando o valor do formulário (a fonte da verdade) muda
  React.useEffect(() => {
    if (field.value) {
      const formattedDate = format(field.value, "dd/MM/yyyy");
      if (inputValue !== formattedDate) {
        setInputValue(formattedDate);
      }
    } else {
        setInputValue("");
    }
  }, [field.value]);

  // Função chamada quando o usuário digita no campo
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const textValue = e.target.value;
    setInputValue(textValue); // Atualiza o que o usuário vê imediatamente

    // Tenta converter o texto para uma data válida
    const parsedDate = parse(textValue, "dd/MM/yyyy", new Date());

    if (isValid(parsedDate)) {
      // Se for válida, atualiza a "fonte da verdade" no react-hook-form
      field.onChange(parsedDate);
    }
  };

  // Função chamada quando uma data é selecionada no calendário
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Atualiza a "fonte da verdade"
      field.onChange(selectedDate);
      // Formata e atualiza o "estado de exibição"
      setInputValue(format(selectedDate, "dd/MM/yyyy"));
      // Fecha o popover
      setIsOpen(false);
    }
  };

  // Função para garantir a sincronia quando o campo perde o foco
  const handleInputBlur = () => {
    if (field.value) {
        const formattedDate = format(field.value, "dd/MM/yyyy");
        setInputValue(formattedDate);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {/* AQUI ESTÁ A GRANDE MUDANÇA: USAMOS UM INPUT NO LUGAR DO BUTTON */}
        <div className="relative w-full">
          <Input
            type="text"
            placeholder="DD/MM/AAAA"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur} // Garante a formatação correta ao sair
            className="w-full pr-10" // Adiciona espaço para o ícone
          />
          <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={field.value}
          onSelect={handleDateSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
