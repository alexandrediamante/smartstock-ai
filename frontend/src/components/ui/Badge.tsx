interface BadgeProps {
  children: React.ReactNode;
  variant?: 'critico' | 'atencao' | 'normal' | 'success' | 'gray';
  className?: string;
}

export function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  const variantClasses = {
    critico: 'bg-danger-100 text-danger-800',
    atencao: 'bg-warning-100 text-warning-800',
    normal: 'bg-gray-100 text-gray-800',
    success: 'bg-primary-100 text-primary-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}