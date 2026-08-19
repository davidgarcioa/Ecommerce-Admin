import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyOrder } from '../../models/daily-order.model';
import { DailyOrderDetailComponent } from './daily-order-detail';

const ORDER_FIXTURE: DailyOrder = {
  id: 'order-test-1',
  orderNumber: 'ORD-TEST-1',
  createdAt: '2026-07-29T10:00:00.000Z',
  customerName: 'Cliente prueba',
  customerPhone: '3000000000',
  productName: 'Producto prueba',
  productGroupId: 'group-test',
  productGroupName: 'Grupo prueba',
  city: 'Bogota',
  carrier: 'Coordinadora',
  status: 'Pendiente',
  orderValue: 0,
  advertisingCost: 0,
  estimatedProfit: 0,
  operationDays: 0,
  urgent: false,
  paymentMethod: 'Contraentrega',
  lastUpdated: '2026-07-29T10:00:00.000Z',
};

describe('DailyOrderDetailComponent', () => {
  let fixture: ComponentFixture<DailyOrderDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyOrderDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DailyOrderDetailComponent);
    fixture.componentRef.setInput('order', ORDER_FIXTURE);
  });

  it('should open and emit close', () => {
    const closeSpy = vi.spyOn(fixture.componentInstance.close, 'emit');
    fixture.detectChanges();

    fixture.componentInstance.close.emit();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(ORDER_FIXTURE.orderNumber);
    expect(closeSpy).toHaveBeenCalled();
  });
});
