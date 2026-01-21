import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { brandStyles, baseStyles } from '../styles.ts';

interface EmailLayoutProps {
  previewText: string;
  children: React.ReactNode;
  showFooter?: boolean;
  footerExtra?: React.ReactNode;
}

export const EmailLayout = ({ 
  previewText, 
  children, 
  showFooter = true,
  footerExtra,
}: EmailLayoutProps) => (
  <Html>
    <Head>
      <meta name="color-scheme" content="light" />
      <meta name="supported-color-schemes" content="light" />
    </Head>
    <Preview>{previewText}</Preview>
    <Body style={baseStyles.body}>
      <Container style={baseStyles.container}>
        {/* Header with Logo */}
        <Section style={baseStyles.headerGradient}>
          <Text style={baseStyles.logo}>{brandStyles.companyName}</Text>
        </Section>
        
        {/* Main Content */}
        <Section style={baseStyles.content}>
          {children}
        </Section>
        
        {/* Footer */}
        {showFooter && (
          <Section style={baseStyles.footer}>
            {footerExtra}
            <Text style={baseStyles.footerText}>
              © {brandStyles.copyrightYear} {brandStyles.companyName}. Todos los derechos reservados.
            </Text>
            <Text style={{ ...baseStyles.footerText, marginTop: '8px' }}>
              <Link href={brandStyles.websiteUrl} style={baseStyles.link}>
                Sitio web
              </Link>
              {' · '}
              <Link href={`mailto:${brandStyles.supportEmail}`} style={baseStyles.link}>
                Soporte
              </Link>
            </Text>
          </Section>
        )}
      </Container>
    </Body>
  </Html>
);

export default EmailLayout;
