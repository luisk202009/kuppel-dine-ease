import { Button } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { baseStyles, brandStyles } from '../styles.ts';

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const EmailButton = ({ 
  href, 
  children, 
  variant = 'primary' 
}: EmailButtonProps) => {
  const style = variant === 'primary' ? baseStyles.button : baseStyles.buttonSecondary;
  
  return (
    <Button href={href} style={style}>
      {children}
    </Button>
  );
};

interface ButtonContainerProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export const ButtonContainer = ({ 
  children, 
  align = 'center' 
}: ButtonContainerProps) => (
  <div style={{ 
    textAlign: align, 
    margin: '24px 0',
  }}>
    {children}
  </div>
);

export default EmailButton;
