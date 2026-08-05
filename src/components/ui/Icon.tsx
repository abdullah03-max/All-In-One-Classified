import * as LucideIcons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface IconProps extends LucideProps {
  name: string;
}

const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) return <LucideIcons.Tag {...props} />;
  return <LucideIcon {...props} />;
};

export default Icon;
