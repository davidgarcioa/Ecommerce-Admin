export interface NavigationItem {
  readonly id: string;
  readonly label: string;
  readonly route: string;
  readonly icon: string;
  readonly order: number;
  readonly exact: boolean;
  readonly visible: boolean;
  readonly permission?: string;
}
