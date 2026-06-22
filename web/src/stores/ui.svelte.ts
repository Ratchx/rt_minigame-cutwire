export class UIStore {
  visible = $state<boolean>(false);
  securityLevel = $state<string>("WAVEVY-eR");
  muted = $state<boolean>(false);

  show() {
    this.visible = true;
  }

  hide() {
    this.visible = false;
  }

  setSecurityLevel(level: string) {
    this.securityLevel = level;
  }

  toggleMute() {
    this.muted = !this.muted;
  }

  sendNUICallback(name: string, data: any) {
    if (typeof window !== 'undefined') {
      const resourceName = (window as any).GetParentResourceName  ? (window as any).GetParentResourceName() : 'minigame';
      
      fetch(`https://${resourceName}/${name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify(data),
      }).catch(err => {
        console.log(`[NUI Callback Debug] Post to ${name} failed:`, err);
      });
    }
  }
}

export const uiStore = new UIStore();
