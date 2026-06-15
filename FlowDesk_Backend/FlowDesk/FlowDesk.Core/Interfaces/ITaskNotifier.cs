using FlowDesk.Core.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FlowDesk.Core.Interfaces
{
    public interface ITaskNotifier
    {
        Task TaskCreated(Guid userId, TaskResponseDto task);
        Task TaskUpdated(Guid userId, TaskResponseDto task);
        Task TaskDeleted(Guid userId, Guid taskId);
    }
}
