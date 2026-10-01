import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Button, Card, Input, Select } from '../../design-system';
import { useToast } from '../../presentation/hooks/useToast';
import { useAppTheme, type ThemePreference } from '../../app-shell/useAppTheme';
import { DEFAULT_BRAND_COLOR, useBrandColor } from '../../app-shell/useBrandColor';
import { FONT_OPTIONS, FONT_SIZE_OPTIONS, useFontPreference } from '../../app-shell/useFontPreference';
import { useCurrentUserId, useUpdateProfileMutation, useUserProfileQuery } from '../dashboard/queries';
import { resolveAvatarUrl } from '../../shared/avatarUrl';
import { updateStoredUser } from '../../shared/useStoredUser';
import styles from './ProfilePage.module.css';

const ALLOWED_AVATAR_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' }
];

/**
 * Fase 8 -- migra /profile pro AppShell. Última tela protegida com
 * layout próprio (Fase 7 já tinha levado o Agente de IA) -- depois dela,
 * `.sys-layout`/Sidebar antiga/useTheme.js não têm mais nenhum renderer
 * no app inteiro, e saem juntos (ver histórico de commits).
 *
 * Mesmas 3 preferências de sempre (tema, cor de destaque, fonte), mas
 * cada uma aplica e persiste na hora -- nenhuma delas precisa de um botão
 * "Salvar" separado (o tema no topbar e a cor de destaque já funcionavam
 * assim; um botão de salvar que não faz nada só pras outras duas seria
 * uma promessa vazia). "Restaurar padrão" continua -- é a única ação em
 * lote que faz sentido pedir com um clique.
 */
export default function ProfilePage() {
  const { addToast } = useToast();
  const { preference: theme, setPreference: setTheme } = useAppTheme();
  const { color: brandColor, setColor: setBrandColor, resetColor: resetBrandColor } = useBrandColor();
  const { font, setFont, fontSize, setFontSize, reset: resetFont } = useFontPreference();

  const userId = useCurrentUserId();
  const profileQuery = useUserProfileQuery(userId);
  const updateProfileMutation = useUpdateProfileMutation(userId);

  const [nome, setNome] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Bug real encontrado: com `!nome` na condição (e `nome` na lista de
  // dependências), apagar o campo até ficar vazio disparava o efeito de
  // novo e reescrevia por cima do que a pessoa tava digitando -- dava pra
  // editar, nunca dava pra LIMPAR. Uma ref (não re-renderiza, não entra
  // em dependência) garante que o prefill rode só uma vez, na primeira
  // vez que os dados chegam, e nunca mais depois disso.
  const hasPrefilledNomeRef = useRef(false);

  useEffect(() => {
    if (profileQuery.data && !hasPrefilledNomeRef.current) {
      setNome(profileQuery.data.nome);
      hasPrefilledNomeRef.current = true;
    }
  }, [profileQuery.data]);

  // Preview local é uma blob: URL -- precisa ser liberada explicitamente
  // (URL.revokeObjectURL) quando troca de arquivo ou desmonta, senão vaza
  // memória a cada foto escolhida.
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_AVATAR_MIME.has(file.type)) {
      addToast('Formato não suportado -- envie JPG, PNG ou WebP.', 'error');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      addToast('A imagem precisa ter no máximo 2MB.', 'error');
      return;
    }

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      addToast('O nome não pode ficar em branco.', 'error');
      return;
    }

    try {
      const updated = await updateProfileMutation.mutateAsync({
        nome: nome.trim(),
        ...(avatarFile ? { avatarFile } : {})
      });
      updateStoredUser({ nome: updated.nome, avatarUrl: updated.avatarUrl });
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarFile(null);
      setAvatarPreview(null);
      addToast('Perfil atualizado com sucesso!', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao atualizar perfil', 'error');
    }
  }

  function handleReset() {
    setTheme('system');
    resetBrandColor();
    resetFont();
    addToast('Preferências restauradas.', 'success');
  }

  const avatarSrc = avatarPreview || resolveAvatarUrl(profileQuery.data?.avatarUrl);

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Perfil</h1>
        <p className={styles.subtitle}>Seus dados e a aparência da Moneta -- nome, foto, tema, cor de destaque e tipografia.</p>
      </div>

      <Card>
        <h2 className={styles.sectionTitle}>Seus dados</h2>
        <p className={styles.sectionHint}>Nome e foto exibidos no topo do app.</p>

        <form className={styles.profileForm} onSubmit={handleSaveProfile}>
          <div className={styles.avatarRow}>
            <span className={styles.avatarPreview}>
              {avatarSrc ? (
                <img src={avatarSrc} alt="" className={styles.avatarPreviewImg} />
              ) : (
                (nome || profileQuery.data?.nome || 'U').charAt(0).toUpperCase()
              )}
            </span>
            <div className={styles.avatarActions}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className={styles.hiddenFileInput}
                onChange={handleFileChange}
                aria-label="Escolher foto de perfil"
              />
              <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                Alterar foto
              </Button>
              <p className={styles.sectionHint}>JPG, PNG ou WebP, até 2MB.</p>
            </div>
          </div>

          <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          <Input label="Email" value={profileQuery.data?.email || ''} disabled hint="O e-mail não pode ser alterado por aqui." />

          <div className={styles.actions}>
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className={styles.sectionTitle}>Tema</h2>
        <p className={styles.sectionHint}>“Sistema” segue o que o seu dispositivo já usa.</p>
        <div className={styles.themeOptions}>
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={[styles.themeCard, theme === opt.value && styles.themeCardActive].filter(Boolean).join(' ')}
              onClick={() => setTheme(opt.value)}
              aria-pressed={theme === opt.value}
            >
              <span className={[styles.themeSwatch, styles[`swatch${opt.value}`]].filter(Boolean).join(' ')} aria-hidden="true" />
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className={styles.sectionTitle}>Cor de destaque</h2>
        <p className={styles.sectionHint}>Usada em botões, links e destaques em todo o app -- qualquer cor, escolhida por você.</p>
        <div className={styles.colorRow}>
          <input
            type="color"
            className={styles.colorInput}
            value={brandColor || DEFAULT_BRAND_COLOR}
            onChange={(e) => setBrandColor(e.target.value)}
            aria-label="Escolher cor de destaque"
          />
          <div className={styles.colorInfo}>
            <span className={styles.colorHex}>{(brandColor || DEFAULT_BRAND_COLOR).toUpperCase()}</span>
            <span className={styles.sectionHint}>Clique no quadrado para escolher qualquer cor (paleta ou RGB/hex)</span>
          </div>
          {brandColor && (
            <Button type="button" variant="secondary" size="sm" onClick={resetBrandColor}>
              Usar cor padrão
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <h2 className={styles.sectionTitle}>Tipografia</h2>
        <div className={styles.typographyGrid}>
          <Select
            label="Fonte"
            value={font}
            onChange={(e) => setFont(e.target.value)}
            options={FONT_OPTIONS}
            placeholder="Hanken Grotesk (padrão)"
          />
          <Select
            label="Tamanho da fonte"
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value as typeof fontSize)}
            options={FONT_SIZE_OPTIONS}
          />
        </div>
      </Card>

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={handleReset}>
          Restaurar padrão
        </Button>
      </div>
    </div>
  );
}
