import React from 'react';
import { getButtonClasses, ButtonSpinner } from '../../utils/buttonStyles.jsx';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  title,
  ...props
}) => {
  const buttonClasses = getButtonClasses(variant, size, className);
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-describedby={ariaDescribedby}
      title={title}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading && <ButtonSpinner />}
      {!loading && leftIcon && (
        <span className="-ml-1 mr-2 h-4 w-4">
          {leftIcon}
        </span>
      )}
      <span>{children}</span>
      {!loading && rightIcon && (
        <span className="ml-2 -mr-1 h-4 w-4">
          {rightIcon}
        </span>
      )}
    </button>
  );
};

export default Button;