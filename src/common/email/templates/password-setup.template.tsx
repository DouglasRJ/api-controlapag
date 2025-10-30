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
}

export const PasswordSetupEmail = ({
  username,
  setupUrl,
}: PasswordSetupEmailProps) => (
  <Html>
    <Head />
    <Preview>Configure sua senha no ControlaPAG</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Bem-vindo(a) ao ControlaPAG!</Heading>
        <Text style={paragraph}>Olá, {username},</Text>
        <Text style={paragraph}>
          Seu cadastro foi realizado com sucesso. Para acessar sua conta,
          primeiro você precisa definir uma senha.
        </Text>
        <Text style={paragraph}>
          Por favor, clique no botão abaixo para criar sua senha:
        </Text>
        <Button style={button} href={setupUrl}>
          Definir Minha Senha
        </Button>
        <Text style={paragraph}>
          Se você não solicitou este e-mail, por favor, ignore-o.
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
  color: '#333',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#555',
  padding: '0 40px',
};

const button = {
  backgroundColor: '#007bff',
  borderRadius: '3px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  padding: '12px 20px',
  margin: '20px auto',
};
