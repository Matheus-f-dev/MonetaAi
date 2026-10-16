// Um único laço de scroll para a landing inteira. Cada efeito ligado à
// rolagem se inscreve aqui em vez de registrar o próprio listener: o
// navegador dispara `scroll` dezenas de vezes por quadro, e isto agrupa tudo
// em UM requestAnimationFrame, que lê layout e escreve variáveis CSS uma vez
// só por quadro. Nada aqui segura ou altera a rolagem nativa.

type Listener = () => void;

const listeners = new Set<Listener>();
let scheduled = false;
let bound = false;

function flush() {
  scheduled = false;
  listeners.forEach((fn) => fn());
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(flush);
}

export function onScrollFrame(fn: Listener): () => void {
  listeners.add(fn);
  if (!bound) {
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    bound = true;
  }
  schedule();
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0 && bound) {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      bound = false;
    }
  };
}
