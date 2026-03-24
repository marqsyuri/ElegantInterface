import { Express } from 'express';
import { isAuthenticated } from '../auth';
import { storage } from '../storage';

export function registerLegacyPaymentRoutes(app: Express) {
  // POST /api/appointments/:id/payment — legacy single-payment endpoint
  app.post('/api/appointments/:id/payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const appointmentId = parseInt(req.params.id);
      const { amount, fullPayment } = req.body;
      const appointmentsList = await storage.getAppointments(userId);
      const appointment = appointmentsList.find((a: any) => a.id === appointmentId);
      if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
      const totalAmount = parseFloat(appointment.totalAmount || '0');
      const currentPaid = parseFloat(appointment.paidAmount || '0');
      if (currentPaid >= totalAmount && totalAmount > 0) {
        return res.status(400).json({ message: 'Appointment is already fully paid', currentPaid, totalAmount });
      }
      const paymentAmount = fullPayment ? (totalAmount - currentPaid) : parseFloat(amount);
      if (paymentAmount <= 0) return res.status(400).json({ message: 'Payment amount must be greater than zero' });
      const outstandingBalance = totalAmount - currentPaid;
      if (paymentAmount > outstandingBalance) {
        return res.status(400).json({ message: `Payment exceeds balance`, outstandingBalance, paymentAmount });
      }
      const newPaidAmount = currentPaid + paymentAmount;
      const paymentStatus = newPaidAmount >= totalAmount ? 'paid' : 'partial';
      const updatedAppointment = await storage.updateAppointment(appointmentId, {
        paidAmount: newPaidAmount.toString(),
        paymentStatus,
      });
      const serviceDescription = appointment.allProcedures?.length > 0
        ? appointment.allProcedures.map((p: any) => p.name).join(', ')
        : appointment.service?.name || 'Service';
      await storage.createTransaction({
        userId, clientId: appointment.clientId, appointmentId,
        type: 'income',
        description: `Payment for ${serviceDescription} - ${appointment.client?.name}`,
        amount: paymentAmount.toString(),
        transactionDate: new Date().toISOString().split('T')[0],
        category: 'Service Payment', isPaid: true,
      });
      res.json(updatedAppointment);
    } catch (error) {
      console.error('Error recording payment:', error);
      res.status(500).json({ message: 'Failed to record payment' });
    }
  });
}
