import { useState } from 'react';
import { Bot, Send, Loader2, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { useChat, useSuggestedQuestions } from '../hooks';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Loading } from '../components/ui/Loading';
import { useToast } from '../components/ui/Toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  references?: any[];
  fallback?: boolean;
  timestamp: Date;
}

export function Assistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const { sendMessage, loading, error } = useChat();
  const { data: suggestions } = useSuggestedQuestions();
  const { addToast } = useToast();

  const handleSend = async (question?: string) => {
    const text = question || input.trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!question) setInput('');

    try {
      const response = await sendMessage(text);
      if (response) {
        const assistantMessage: Message = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.answer,
          references: response.references,
          fallback: response.fallback,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch {
      addToast('error', 'Erro ao enviar mensagem');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary-600" />
            Stock Assistant
          </h1>
          <p className="text-gray-500 mt-1">Assistente de IA para gestão de estoque</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="gray">v0.1.0</Badge>
        </div>
      </div>

      {/* Suggested Questions */}
      {messages.length === 0 && suggestions?.questions && (
        <Card>
          <CardBody>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" />
              Perguntas sugeridas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {suggestions.questions.map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => handleSend(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col min-h-[500px] max-h-[600px]">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Bot className="w-16 h-16 mb-4" />
              <p className="text-lg">Como posso ajudar?</p>
              <p className="text-sm">Faça uma pergunta sobre seu estoque</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-gray-100 text-gray-600' : 'bg-primary-100 text-primary-600'
                }`}>
                  {msg.role === 'user' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>
                <div className={`max-w-[75%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block p-4 rounded-2xl ${
                    msg.role === 'user' ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-900 rounded-tl-none'
                  }`}>
                    <div className="prose prose-sm max-w-none {msg.role === 'user' ? 'prose-invert' : ''}">
                      {msg.content.split('\n').map((line, i) => (
                        <p key={i} className="whitespace-pre-wrap">{line}</p>
                      ))}
                    </div>
                    {msg.references && msg.references.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200/50 border-primary-100">
                        <p className="text-xs font-medium text-gray-500 mb-2">Referências:</p>
                        <div className="flex flex-wrap gap-1">
                          {msg.references.map((ref: any, i: number) => (
                            <Badge key={i} variant="gray" className="text-xs">
                              {ref.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {msg.fallback && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-warning-600">
                        <AlertCircle className="w-3 h-3" />
                        <span>Resposta baseada em regras locais (fallback)</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{format(msg.timestamp, 'HH:mm', { locale: ptBR })}</p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua pergunta..."
              className="flex-1"
              disabled={loading}
            />
            <Button onClick={() => handleSend()} disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-danger-600 mt-2">{error}</p>
          )}
        </div>
      </Card>

      {/* Disclaimer */}
      <Card className="p-4 bg-gray-50 border-gray-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p className="font-medium">Atenção:</p>
            <p>O assistente usa dados reais do seu estoque para responder. Valores financeiros são estimativas baseadas em médias de vendas e validades.
            Recomendações não substituem decisões gerenciais. Verifique sempre antes de agir.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}