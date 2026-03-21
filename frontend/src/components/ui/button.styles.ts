export interface ButtonVariantProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function buttonVariants({ variant = 'primary', size = 'md' }: ButtonVariantProps) {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-300 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:shadow-xl hover:shadow-cyan-500/30',
    secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/40',
    ghost: 'text-white hover:bg-white/5',
    outline: 'border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return `${baseClasses} ${variants[variant]} ${sizes[size]}`;
}
