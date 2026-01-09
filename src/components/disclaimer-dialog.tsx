import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Button } from './ui/button';

interface DisclaimerDialogProps {
  open: boolean;
  onAccept: () => void;
}

export function DisclaimerDialog({ open, onAccept }: DisclaimerDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onAccept()}>
      <AlertDialogContent className="sm:max-w-md gap-6">
        <AlertDialogHeader className="space-y-1">
          <AlertDialogTitle className="text-xl font-semibold tracking-tight">
            Before you continue
          </AlertDialogTitle>
          <p className="text-sm text-muted-foreground">
            Please read this important information
          </p>
        </AlertDialogHeader>
        
        <AlertDialogDescription asChild>
          <div className="space-y-5">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
              <p className="text-sm text-foreground leading-relaxed">
                This is a <span className="text-destructive font-semibold">portfolio project</span>, not an official emergency service.
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Do not rely on this dashboard for emergency decisions. Always use the official source:
              </p>
              
              <a 
                href="https://emergency.vic.gov.au" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-center py-2.5 px-4 bg-muted/50 hover:bg-muted rounded-lg text-sm text-foreground font-medium transition-colors"
              >
                emergency.vic.gov.au
              </a>
            </div>
            
            <p className="text-xs text-muted-foreground text-center pt-1">
              In an emergency, call <strong className="text-foreground font-semibold">000</strong>
            </p>
          </div>
        </AlertDialogDescription>
        
        <AlertDialogFooter>
          <AlertDialogAction asChild>
            <Button onClick={onAccept} className="w-full">
              I understand
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
