import React, { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { getInitials } from '../../utils/helpers';

// ============================================================
// BUTTON
// ============================================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary', size = 'md', loading = false, icon, iconRight,
  className, children, disabled, ...props
}, ref) => {
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm',
    secondary: 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200',
    accent: 'bg-accent-500 hover:bg-accent-600 text-white shadow-sm',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-sm',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20',
  };
  const sizes = {
    xs: 'px-2.5 py-1 text-xs rounded-lg',
    sm: 'px-3 py-1.5 text-sm rounded-xl',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-2xl',
  };
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
});
Button.displayName = 'Button';

// ============================================================
// INPUT
// ============================================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label, error, hint, leftIcon, rightIcon, className, ...props
}, ref) => (
  <div className="w-full">
    {label && <label className="label">{label}</label>}
    <div className="relative">
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {leftIcon}
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          'input',
          leftIcon && 'pl-10',
          rightIcon && 'pr-10',
          error && 'border-red-400 focus:ring-red-400',
          className
        )}
        {...props}
      />
      {rightIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          {rightIcon}
        </div>
      )}
    </div>
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    {hint && !error && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
  </div>
));
Input.displayName = 'Input';

// ============================================================
// TEXTAREA
// ============================================================
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label, error, hint, className, ...props
}, ref) => (
  <div className="w-full">
    {label && <label className="label">{label}</label>}
    <textarea
      ref={ref}
      className={cn('input resize-none', error && 'border-red-400 focus:ring-red-400', className)}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    {hint && !error && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
  </div>
));
Textarea.displayName = 'Textarea';

// ============================================================
// SELECT
// ============================================================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label, error, options, placeholder, className, ...props
}, ref) => (
  <div className="w-full">
    {label && <label className="label">{label}</label>}
    <select
      ref={ref}
      className={cn('input cursor-pointer', error && 'border-red-400', className)}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
));
Select.displayName = 'Select';

// ============================================================
// MODAL
// ============================================================
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto',
              sizes[size]
            )}
          >
            {title && (
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="p-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ============================================================
// BADGE
// ============================================================
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className }) => {
  const variants = {
    default: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  };
  return (
    <span className={cn('badge', variants[variant], className)}>
      {children}
    </span>
  );
};

// ============================================================
// AVATAR
// ============================================================
interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name = '', size = 'md', className }) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500', 'bg-rose-500'];
  const colorIndex = name.charCodeAt(0) % colors.length;

  if (src) return (
    <img src={src} alt={name} className={cn('rounded-full object-cover', sizes[size], className)} />
  );
  return (
    <div className={cn('rounded-full flex items-center justify-center font-semibold text-white', sizes[size], colors[colorIndex], className)}>
      {getInitials(name) || '?'}
    </div>
  );
};

// ============================================================
// SPINNER
// ============================================================
export const Spinner: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <Loader2 size={size} className={cn('animate-spin text-primary-600', className)} />
);

// ============================================================
// EMPTY STATE
// ============================================================
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon && <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-400">{icon}</div>}
    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">{title}</h3>
    {description && <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">{description}</p>}
    {action}
  </div>
);

// ============================================================
// CARD
// ============================================================
export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({
  children, className, onClick
}) => (
  <div
    className={cn('card p-4', onClick && 'cursor-pointer hover:shadow-card-hover transition-shadow', className)}
    onClick={onClick}
  >
    {children}
  </div>
);

// ============================================================
// STAT CARD
// ============================================================
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color = 'blue' }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', colors[color])}>
          {icon}
        </div>
        {trend && (
          <span className={cn('text-sm font-medium', trend.value >= 0 ? 'text-green-600' : 'text-red-500')}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{title}</p>
      {trend && <p className="text-xs text-slate-400 mt-1">{trend.label}</p>}
    </div>
  );
};

// ============================================================
// SKELETON
// ============================================================
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg', className)} />
);

// ============================================================
// CONFIRM DIALOG
// ============================================================
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', loading
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-slate-600 dark:text-slate-400 mb-6">{message}</p>
    <div className="flex gap-3">
      <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
      <Button variant="danger" className="flex-1" onClick={onConfirm} loading={loading}>
        {confirmText}
      </Button>
    </div>
  </Modal>
);

export * from './SearchableSelect';
