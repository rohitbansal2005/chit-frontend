import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/apiClient";
import { 
  Flag,
  AlertTriangle
} from "lucide-react";

const MAX_REPORT_CHARACTERS = 500;

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId?: string;
  userId: string;
  userName: string;
}

const reportReasons = [
  { value: "spam", label: "Spam or repetitive content" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate-speech", label: "Hate speech or discrimination" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "violence", label: "Violence or threats" },
  { value: "misinformation", label: "False information" },
  { value: "scam", label: "Scam or fraud" },
  { value: "impersonation", label: "Impersonation" },
  { value: "copyright", label: "Copyright violation" },
  { value: "other", label: "Other" }
];

export const ReportModal = ({ isOpen, onClose, messageId, userId, userName }: ReportModalProps) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMessageReport = Boolean(messageId);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast({
        title: "Reason Required",
        description: "Please select a reason for reporting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post('/reports', {
        messageId: messageId || undefined,
        targetUserId: userId,
        reason: selectedReason,
        details: additionalDetails
      });

      const selectedReasonLabel = reportReasons.find(r => r.value === selectedReason)?.label;

      toast({
        title: "Report Submitted",
        description: `Your report against ${userName} has been submitted successfully. We'll review it shortly.`,
      });

      console.log({ messageId, userId, userName, reason: selectedReason, reasonLabel: selectedReasonLabel, additionalDetails });

      // Reset form
      setSelectedReason("");
      setAdditionalDetails("");
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Flag className="w-5 h-5" />
            {isMessageReport ? 'Report Message' : 'Report User'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span>
                Reporting {isMessageReport ? 'message' : 'user'} from <strong>{userName}</strong>
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Report *</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reportReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="details">Additional Details (Optional)</Label>
              <span className={`text-xs ${
                additionalDetails.length > MAX_REPORT_CHARACTERS 
                  ? 'text-red-500' 
                  : additionalDetails.length > MAX_REPORT_CHARACTERS * 0.8 
                    ? 'text-yellow-500' 
                    : 'text-muted-foreground'
              }`}>
                {additionalDetails.length}/{MAX_REPORT_CHARACTERS}
              </span>
            </div>
            <Textarea
              id="details"
              placeholder="Provide any additional context..."
              value={additionalDetails}
              onChange={(e) => {
                if (e.target.value.length <= MAX_REPORT_CHARACTERS) {
                  setAdditionalDetails(e.target.value);
                }
              }}
              rows={3}
              className={`resize-none ${
                additionalDetails.length > MAX_REPORT_CHARACTERS 
                  ? 'border-red-500 focus:border-red-500' 
                  : ''
              }`}
              maxLength={MAX_REPORT_CHARACTERS}
            />
            {additionalDetails.length > MAX_REPORT_CHARACTERS * 0.9 && (
              <p className={`text-xs ${
                additionalDetails.length > MAX_REPORT_CHARACTERS 
                  ? 'text-red-500' 
                  : 'text-yellow-500'
              }`}>
                {additionalDetails.length > MAX_REPORT_CHARACTERS 
                  ? 'Character limit exceeded' 
                  : `${MAX_REPORT_CHARACTERS - additionalDetails.length} characters remaining`
                }
              </p>
            )}
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> False reports may result in penalties to your account. Please only report content that violates our community guidelines.
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedReason || additionalDetails.length > MAX_REPORT_CHARACTERS}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Flag className="w-4 h-4" />
                Submit Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
