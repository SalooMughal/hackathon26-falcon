import type { NavigateFunction } from 'react-router-dom'
import type { Step } from 'react-joyride'
import { useConversationsStore } from '../store/conversationsStore'

export type TourHelpers = {
  navigate: NavigateFunction
  prepareShell: () => void
}

function wait(ms = 400) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function go(helpers: TourHelpers, path: string) {
  helpers.prepareShell()
  helpers.navigate(path)
  await wait(450)
}

async function goChat(helpers: TourHelpers) {
  helpers.prepareShell()
  const latest = useConversationsStore.getState().conversations[0]
  helpers.navigate(latest ? `/c/${latest.id}` : '/')
  await wait(500)
}

/** Brief requirements first, then FalconAI extras beyond the assignment. */
export function buildTourSteps(helpers: TourHelpers): Step[] {
  return [
    // —— Team brief ——
    {
      target: '[data-tour="brand"]',
      placement: 'center',
      title: 'Team Falcon - Client Onboarding Buddy',
      content:
        'Members: Mamoor, Zakria, Khurram. Objective: a chatbot that answers new-joiner questions only from project docs, with citations - no hallucinated answers.',
      skipBeacon: true,
      before: async () => {
        helpers.prepareShell()
        await wait(200)
      },
    },
    {
      target: '[data-tour="nav-knowledge-base"]',
      title: '1 · Knowledge base docs',
      content:
        'Requirement: select or write 5–10 short markdown docs (overview, setup, team norms, etc.). Admins manage those docs here.',
      skipBeacon: true,
      before: async () => {
        helpers.prepareShell()
        await wait(200)
      },
    },
    {
      target: '[data-tour="kb-page"]',
      title: 'Docs power retrieval',
      content:
        'Upload or edit markdown, then index it. We use embeddings + Pinecone (stretch goal beyond simple keyword search) so chat can retrieve the best snippets.',
      skipBeacon: true,
      before: async () => go(helpers, '/knowledge-base'),
    },
    {
      target: '[data-tour="nav-chat"]',
      title: '2 · Single chat page',
      content:
        'Requirement: one chat UI to ask a question and see the answer with its citation. Chat lives here in the sidebar.',
      skipBeacon: true,
      before: async () => {
        helpers.prepareShell()
        await wait(200)
      },
    },
    {
      target: '[data-tour="chat-composer"]',
      title: 'Ask a grounded question',
      content:
        'On each question we retrieve the most relevant snippets, pass them to the LLM as context, and stream an answer grounded in that context.',
      skipBeacon: true,
      before: async () => goChat(helpers),
    },
    {
      target: '[data-tour="chat-disclaimer"]',
      title: '3 · Citations required',
      content:
        'Every grounded answer cites the source document name. Click a citation to open the passage in the knowledge base - judges check that sources are correct.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="chat-area"]',
      title: '4 · No guessing',
      content:
        'Acceptance: if the docs do not cover the question, FalconAI refuses instead of fabricating. Try an out-of-scope question in the live demo.',
      skipBeacon: true,
    },

    // —— Beyond the brief ——
    {
      target: '[data-tour="brand"]',
      placement: 'center',
      title: 'Beyond the brief',
      content:
        'The assignment asked for docs + retrieval + a chat page. We also shipped a full FalconAI workspace around that core.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="nav-conversations"]',
      title: 'Named conversations',
      content:
        'Multiple chats with auto-titles, history per conversation, and a ChatGPT-style sidebar - not just a single throwaway thread.',
      skipBeacon: true,
      before: async () => {
        helpers.prepareShell()
        await wait(250)
      },
    },
    {
      target: '[data-tour="nav-users"]',
      title: 'Users & access',
      content: 'Create and manage users with roles - so the buddy is multi-user, not a single shared demo login.',
      skipBeacon: true,
      before: async () => {
        helpers.prepareShell()
        await wait(200)
      },
    },
    {
      target: '[data-tour="nav-roles"]',
      title: 'Roles & permissions',
      content: 'RBAC for every feature (read / create / update / delete) so admins and joiners see the right tools.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="nav-features"]',
      title: 'Features registry',
      content: 'Features are first-class - the same model that powers the sidebar and API permission checks.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="nav-notifications"]',
      title: 'Noticeboard',
      content: 'Broadcast notices to everyone on the team - handy for onboarding announcements during the hackathon.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="nav-platform-settings"]',
      title: 'Platform settings',
      content:
        'Switch AI providers, RAG thresholds, and API keys at runtime - no redeploy to try OpenAI, Claude, or Gemini.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="nav-profile"]',
      title: 'Profile',
      content: 'Users can update their display name and password without an admin intervening.',
      skipBeacon: true,
    },
    {
      target: '[data-tour="tour-button"]',
      title: 'You’re ready to demo',
      content:
        'Re-run this tour anytime. For judges: show a covered question with citations, then an out-of-scope refusal. Good luck, Team Falcon!',
      skipBeacon: true,
      before: async () => {
        helpers.prepareShell()
        await wait(200)
      },
    },
  ]
}
