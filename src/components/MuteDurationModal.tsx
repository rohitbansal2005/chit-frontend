import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Clock, VolumeX, Calendar } from "lucide-react";

interface MuteDurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (duration: number | null) => void; // null means permanent
  userName: string;
}

export const MuteDurationModal = ({ isOpen, onClose, onConfirm, userName }: MuteDurationModalProps) => {
  const [selectedDuration, setSelectedDuration] = useState<string>("1");

  const durationOptions = [
    { value: "1", label: "1 Day", hours: 24, icon: Clock },
    { value: "15", label: "15 Days", hours: 24 * 15, icon: Calendar },
    { value: "30", label: "30 Days", hours: 24 * 30, icon: Calendar },
    { value: "permanent", label: "Permanent (Always Mute)", hours: null, icon: VolumeX },
  ];

  const handleConfirm = () => {
    const selected = durationOptions.find(opt => opt.value === selectedDuration);
    onConfirm(selected?.hours || null);
    onClose();
  };

  const selectedOption = durationOptions.find(opt => opt.value === selectedDuration);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <VolumeX className="w-5 h-5 text-orange-600" />
            Mute User
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Select how long you want to mute <span className="font-medium">{userName}</span>:
          </div>
          
          <RadioGroup value={selectedDuration} onValueChange={setSelectedDuration}>
            <div className="space-y-3">
              {durationOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <div key={option.value} className="flex items-center space-x-3">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label 
                      htmlFor={option.value} 
                      className="flex items-center gap-2 cursor-pointer flex-1 p-2 rounded hover:bg-muted/50"
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="font-medium">{option.label}</span>
                      {option.hours && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          ({option.hours}h)
                        </span>
                      )}
                    </Label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
          
          {selectedOption && (
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                <strong>Selected:</strong> {selectedOption.label}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                {selectedOption.hours 
                  ? `The user will be automatically unmuted after ${selectedOption.hours} hours.`
                  : "The user will remain muted until manually unmuted by a moderator."
                }
              </p>
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="flex-1" variant="destructive">
              Mute User
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
