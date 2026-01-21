import { Text, Section, Hr } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { EmailLayout } from './components/EmailLayout.tsx';
import { EmailButton, ButtonContainer } from './components/EmailButton.tsx';
import { brandStyles, baseStyles, roleLabels } from './styles.ts';

interface TeamInvitationEmailProps {
  inviterName?: string;
  companyName: string;
  role: string;
  inviteUrl: string;
  expiresIn?: string;
}

export const TeamInvitationEmail = ({
  inviterName,
  companyName,
  role,
  inviteUrl,
  expiresIn = '7 días',
}: TeamInvitationEmailProps) => {
  const roleLabel = roleLabels[role] || role;
  
  return (
    <EmailLayout previewText={`${inviterName ? `${inviterName} te invitó` : 'Has sido invitado'} a unirte a ${companyName} en Kuppel`}>
      <Text style={{ ...baseStyles.heading, textAlign: 'center' as const }}>
        ¡Te han invitado a unirte al equipo!
      </Text>
      
      <Text style={baseStyles.paragraph}>
        ¡Hola!
      </Text>
      
      <Text style={baseStyles.paragraph}>
        {inviterName ? (
          <>
            <strong>{inviterName}</strong> te ha invitado a unirte a{' '}
          </>
        ) : (
          <>Has sido invitado a unirte a </>
        )}
        <strong>{companyName}</strong> en Kuppel como <strong>{roleLabel}</strong>.
      </Text>
      
      <Section style={baseStyles.infoBox}>
        <Text style={{ 
          margin: '0 0 8px 0', 
          fontSize: '14px',
          color: brandStyles.textMuted,
        }}>
          Detalles de la invitación:
        </Text>
        <Text style={{ 
          margin: '0 0 4px 0', 
          fontSize: '15px',
          color: brandStyles.textPrimary,
        }}>
          <strong>Empresa:</strong> {companyName}
        </Text>
        <Text style={{ 
          margin: '0', 
          fontSize: '15px',
          color: brandStyles.textPrimary,
        }}>
          <strong>Rol:</strong> {roleLabel}
        </Text>
      </Section>
      
      <ButtonContainer>
        <EmailButton href={inviteUrl}>
          Aceptar Invitación
        </EmailButton>
      </ButtonContainer>
      
      <Text style={{ 
        ...baseStyles.paragraph, 
        fontSize: '13px',
        color: brandStyles.textMuted,
        textAlign: 'center' as const,
      }}>
        Esta invitación expirará en {expiresIn}.
      </Text>
      
      <Hr style={baseStyles.divider} />
      
      <Text style={{ 
        ...baseStyles.paragraph, 
        fontSize: '12px',
        color: brandStyles.textMuted,
      }}>
        Si el botón no funciona, copia y pega este enlace en tu navegador:
      </Text>
      <Text style={{ 
        fontSize: '12px',
        color: brandStyles.primaryColor,
        wordBreak: 'break-all' as const,
        margin: '0',
      }}>
        {inviteUrl}
      </Text>
      
      <Text style={{ 
        ...baseStyles.paragraph, 
        fontSize: '12px',
        color: brandStyles.textMuted,
        marginTop: '24px',
      }}>
        Si no esperabas esta invitación, puedes ignorar este correo de forma segura.
      </Text>
    </EmailLayout>
  );
};

export default TeamInvitationEmail;
