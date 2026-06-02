import { useI18n } from "../../components/useI18n";
import { ArrowRight, MessageSquare, Zap } from "lucide-react";

interface HomeProps {
  onNavigate: (view: string) => void;
  onNewChat: () => void;
  profile?: string;
}

function Home({ onNavigate, onNewChat, profile }: HomeProps): React.JSX.Element {
  const { t } = useI18n();

  return (
    <div className="home-container">
      <div className="home-header">
        <div className="home-title-row"><MessageSquare size={18} /><h2 className="home-title">{t("navigation.home")}</h2></div>
      </div>
      <div className="home-actions">
        <button className="home-action-card" onClick={() => onNavigate("chat")}>
          <div className="home-action-main"><MessageSquare size={20} /><div><div className="home-action-title">Continue Chat</div><div className="home-action-desc">Start a new conversation</div></div></div>
          <ArrowRight size={16} className="home-action-arrow" />
        </button>
        <button className="home-action-card home-action-secondary" onClick={onNewChat}>
          <div className="home-action-main"><Zap size={20} /><div><div className="home-action-title">New Chat</div><div className="home-action-desc">Start fresh</div></div></div>
          <ArrowRight size={16} className="home-action-arrow" />
        </button>
      </div>
      <div className="home-quick-links">
        <button className="home-quick-link" onClick={() => onNavigate("agents")}><span>Agents</span> <ArrowRight size={12} /></button>
        <button className="home-quick-link" onClick={() => onNavigate("modelControl")}><span>Model Control</span> <ArrowRight size={12} /></button>
        <button className="home-quick-link" onClick={() => onNavigate("monitoring")}><span>Monitoring</span> <ArrowRight size={12} /></button>
        <button className="home-quick-link" onClick={() => onNavigate("system")}><span>System</span> <ArrowRight size={12} /></button>
        <button className="home-quick-link" onClick={() => onNavigate("extensions")}><span>Extensions</span> <ArrowRight size={12} /></button>
      </div>
    </div>
  );
}

export default Home;
