interface DaumPostcodeData {
  address: string
  addressType: 'R' | 'J'
  bname: string
  buildingName: string
  roadAddress: string
  jibunAddress: string
  zonecode: string
}

interface DaumPostcode {
  new (options: {
    oncomplete: (data: DaumPostcodeData) => void
    width?: string
    height?: string
  }): {
    open(options?: { left?: number; top?: number }): void
    embed(element: HTMLElement): void
  }
}

interface Window {
  daum: {
    Postcode: DaumPostcode
  }
}
