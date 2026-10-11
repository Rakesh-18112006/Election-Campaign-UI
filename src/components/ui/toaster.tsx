import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, CheckCircle2, AlertCircle } from './toast';
import { useToastState } from '@/hooks/useToast';

export function Toaster() {
  const toasts = useToastState();

  return (
    <ToastProvider>
      {toasts.map((t) => (
        <Toast key={t.id} variant={t.variant}>
          <div className="flex items-start gap-2">
            {t.variant === 'success' && <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />}
            {t.variant === 'destructive' && <AlertCircle className="h-4 w-4 mt-0.5 text-red-600 shrink-0" />}
            <div>
              <ToastTitle>{t.title}</ToastTitle>
              {t.description && <ToastDescription>{t.description}</ToastDescription>}
            </div>
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
