import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';

interface PasswordSetupEmailProps {
  username: string;
  setupUrl: string;
  providerName?: string;
}

export const PasswordSetupEmail = ({
  username,
  setupUrl,
  providerName,
}: PasswordSetupEmailProps) => (
  <Html>
    <Head />
    <Preview>
      {providerName
        ? `${providerName} criou sua conta no ControlaPAG`
        : 'Seu prestador criou sua conta no ControlaPAG'}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Bem-vindo(a) a ControlaPAG!</Heading>
        <Text style={paragraph}>Olá, {username}!</Text>
        <Text style={paragraph}>
          {providerName ? (
            <>
              <strong>{providerName}</strong> criou uma conta para você na
              ControlaPAG, nossa plataforma de gestão de pagamentos e
              assinaturas.
            </>
          ) : (
            <>
              Seu prestador de serviços criou uma conta para você na
              ControlaPAG, nossa plataforma de gestão de pagamentos e
              assinaturas.
            </>
          )}
        </Text>
        <Text style={paragraph}>
          Para começar a usar a plataforma e acompanhar suas cobranças, você
          precisa definir sua senha de acesso.
        </Text>
        <Text style={paragraph}>
          Clique no botão abaixo para criar sua senha:
        </Text>
        <Button style={button} href={setupUrl}>
          Criar Minha Senha
        </Button>
        <Text style={footerText}>
          Este link é válido por 24 horas. Após definir sua senha, você poderá
          acessar sua conta e visualizar todas as informações sobre seus
          serviços e pagamentos.
        </Text>
        <Text style={footerText}>
          {providerName ? (
            <>
              Se você não esperava este e-mail, por favor entre em contato com{' '}
              <strong>{providerName}</strong>.
            </>
          ) : (
            <>
              Se você não esperava este e-mail, por favor entre em contato com
              seu prestador de serviços.
            </>
          )}
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PasswordSetupEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  border: '1px solid #f0f0f0',
  borderRadius: '4px',
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  marginTop: '32px',
  textAlign: 'center' as const,
  color: '#F57418',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#333',
  padding: '0 40px',
  marginBottom: '16px',
};

const button = {
  backgroundColor: '#F57418',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '220px',
  padding: '14px 24px',
  margin: '24px auto',
};

const footerText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#666',
  padding: '0 40px',
  marginTop: '24px',
};
